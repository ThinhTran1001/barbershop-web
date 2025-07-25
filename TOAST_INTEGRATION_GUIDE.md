# Toast Notification Integration Guide

## Quick Setup

### 1. **Add ToastProvider to Your App Root**

Add the ToastProvider component to your main App component or root component:

```jsx
// App.jsx or your root component
import React from 'react';
import ToastProvider from './components/ToastProvider';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        {/* Your existing app content */}
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
```

### 2. **Import and Use ToastService**

In any component where you need notifications:

```jsx
import ToastService from '../services/toastService.jsx';

// In your component
const handleSuccess = () => {
  ToastService.showBookingSuccess({
    serviceName: 'Hair Cut',
    barberName: 'John Doe',
    date: '2024-07-24',
    time: '10:00',
    duration: 30
  });
};

const handleError = () => {
  ToastService.showNetworkError('booking creation');
};
```

## Available Toast Methods

### Success Notifications
```javascript
// Booking creation success
ToastService.showBookingSuccess(bookingDetails);

// Validation success
ToastService.showValidationSuccess(message);
```

### Error Notifications
```javascript
// Customer double-booking
ToastService.showCustomerDoubleBookingError(details);

// Barber conflict
ToastService.showBarberConflictError(details);

// Daily limit exceeded
ToastService.showDailyLimitError(barberName);

// Schedule update failure
ToastService.showScheduleUpdateError();

// Network errors
ToastService.showNetworkError(operation);

// Validation errors
ToastService.showValidationError(details);
```

### Loading States
```javascript
// Show loading
ToastService.showLoadingToast(message, uniqueKey);

// Hide loading
ToastService.hideLoadingToast(uniqueKey);
```

### Generic Notifications
```javascript
// Warning
ToastService.showWarning(message, description, duration);

// Info
ToastService.showInfo(message, description, duration);

// Clear all
ToastService.clearAll();
```

## Testing Your Implementation

### 1. **Test Success Notifications**
```javascript
// Test booking success
ToastService.showBookingSuccess({
  serviceName: 'Test Service',
  barberName: 'Test Barber',
  date: '2024-07-24',
  time: '10:00',
  duration: 30
});
```

### 2. **Test Error Notifications**
```javascript
// Test customer conflict
ToastService.showCustomerDoubleBookingError({
  reason: 'Test conflict message',
  conflictingBarber: 'Test Barber',
  conflictTime: new Date().toISOString(),
  conflictDuration: 60
});
```

### 3. **Test Loading States**
```javascript
// Show loading
ToastService.showLoadingToast('Testing loading...', 'test-key');

// Hide after 3 seconds
setTimeout(() => {
  ToastService.hideLoadingToast('test-key');
}, 3000);
```

## Customization Options

### Modify Default Settings
Edit `toastService.jsx` to change default configurations:

```javascript
// In toastService.jsx
notification.config({
  placement: 'topRight', // topLeft, topRight, bottomLeft, bottomRight
  duration: 4.5,         // Default duration in seconds
  maxCount: 3,           // Maximum notifications shown at once
});
```

### Custom Styling
Modify `ToastProvider.jsx` to customize the CSS styles:

```css
/* Example: Change success notification color */
.ant-notification-notice-success {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
  border-left: 4px solid #your-border-color;
}
```

## Best Practices

### 1. **Use Appropriate Duration**
- Success: 4-6 seconds
- Simple errors: 6-8 seconds  
- Complex errors: 8-10 seconds
- Loading: Until completion

### 2. **Provide Context**
Always include relevant details in error messages:
```javascript
// Good
ToastService.showValidationError({
  reason: 'Time slot conflicts with existing booking at 10:00 AM'
});

// Avoid
ToastService.showValidationError({
  reason: 'Error occurred'
});
```

### 3. **Handle Loading States**
Always pair loading toasts with completion:
```javascript
const handleAsyncOperation = async () => {
  ToastService.showLoadingToast('Processing...', 'operation-key');

  try {
    await someAsyncOperation();
    ToastService.hideLoadingToast('operation-key'); // Uses notification.destroy(key)
    ToastService.showValidationSuccess('Operation completed');
  } catch (error) {
    ToastService.hideLoadingToast('operation-key'); // Always hide loading on error
    ToastService.showNetworkError('operation');
  }
};
```

### 4. **Unique Keys for Loading**
Use unique keys for different loading operations:
```javascript
// Different operations should have different keys
ToastService.showLoadingToast('Creating booking...', 'booking-creation');
ToastService.showLoadingToast('Loading slots...', 'slot-loading');
```

## Troubleshooting

### Common Issues

#### 1. **Toasts Not Appearing**
- Ensure ToastProvider is added to your app root
- Check console for JavaScript errors
- Verify Ant Design is properly installed

#### 2. **Styling Issues**
- Check if custom CSS is conflicting
- Verify ToastProvider CSS is being applied
- Test with browser developer tools

#### 3. **Multiple Toasts Overlapping**
- Use unique keys for different operations
- Consider using `ToastService.clearAll()` before showing new toasts
- Check maxCount configuration

#### 4. **Mobile Display Issues**
- Test on actual mobile devices
- Check responsive CSS in ToastProvider
- Verify viewport meta tag is set

### Debug Mode
Add this to test all notification types:
```javascript
const testAllNotifications = () => {
  ToastService.showValidationSuccess('Test success');
  
  setTimeout(() => {
    ToastService.showValidationError({
      reason: 'Test error message'
    });
  }, 1000);
  
  setTimeout(() => {
    ToastService.showWarning('Test Warning', 'Test warning description');
  }, 2000);
};
```

## Performance Considerations

### 1. **Limit Concurrent Toasts**
The system is configured to show maximum 3 toasts at once to avoid overwhelming users.

### 2. **Memory Management**
Loading toasts are automatically cleaned up, but ensure you call `hideLoadingToast()` to prevent memory leaks.

### 3. **Animation Performance**
CSS animations are optimized for 60fps performance on modern browsers.

## Conclusion

The toast notification system is now ready to use throughout your application. Follow this guide to integrate it properly and provide excellent user feedback for all booking operations.
