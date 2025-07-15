# 📚 Barbershop Booking System - User Guide

## 🎯 Overview

This comprehensive guide will help you navigate and use all features of the barbershop booking system, including service booking, barber selection, schedule management, and feedback system.

## 👥 User Roles

### 🧑‍💼 Customer
- Browse and book services
- Select preferred barbers
- Manage bookings
- Provide feedback after service completion

### ✂️ Barber
- View personal schedule and calendar
- Manage daily bookings
- Update booking statuses
- Respond to customer feedback

### 👨‍💼 Admin
- Manage barber schedules and absences
- Oversee all bookings and conflicts
- Moderate customer feedback
- Generate reports and analytics

---

## 🛒 Customer Features

### 1. Service Booking Process

#### Step 1: Browse Services (`/services`)
- **Access**: Navigate to Services page from main menu
- **Features**:
  - View all available services with prices and descriptions
  - Use advanced filters:
    - **Category**: Cut, Perm, Color, Combo, Styling, Treatment
    - **Hair Type**: Straight, Wavy, Curly, Coily
    - **Style Compatibility**: Short, Medium, Long, Beard
    - **Price Range**: Slider to set min/max budget
  - **Search**: Find services by name or description
  - **Personalized Recommendations**: Get suggestions based on your hair type and booking history

#### Step 2: Select Barber (`/choose-barber`)
- **Manual Selection**:
  - Browse available barbers with ratings and specialties
  - Filter by expertise tags (fade, coloring, beard, etc.)
  - View barber profiles with experience and customer reviews
- **Auto-Assignment**:
  - Click "Tự động chọn thợ phù hợp" for intelligent matching
  - System considers service requirements and barber expertise
  - Shows alternative options if needed
- **Skip Option**: Choose barber later during booking

#### Step 3: Choose Time Slot (`/choose-time-slot`)
- **Real-time Availability**: See available time slots for selected date
- **Conflict Prevention**: System prevents double-booking automatically
- **Time Restrictions**: Must book at least 30 minutes in advance
- **Duration Display**: Shows service duration and estimated completion time

#### Step 4: Booking Information (`/booking-info`)
- **Customer Details**: Enter/confirm contact information
- **Special Requests**: Add notes for the barber
- **Notification Preferences**: Choose how to receive updates
- **Final Review**: Confirm all booking details before submission

### 2. Booking Management (`/my-booking`)

#### View Your Bookings
- **Filter Options**:
  - Status: Pending, Confirmed, Completed, Cancelled
  - Date Range: Custom date selection
  - Search: Find bookings by service or barber name

#### Booking Actions
- **Cancel Booking**: Available up to 2 hours before appointment
- **View Details**: See complete booking information
- **Provide Feedback**: Rate and review completed services

#### Booking Statuses
- 🟡 **Pending**: Waiting for barber confirmation
- 🔵 **Confirmed**: Barber has accepted the booking
- 🟢 **Completed**: Service finished successfully
- 🔴 **Cancelled**: Booking was cancelled
- 🟠 **No Show**: Customer didn't attend appointment

### 3. Feedback System (`/feedback/:bookingId`)

#### Leaving Feedback
- **Access**: Click "Đánh giá" button on completed bookings
- **Rating Categories**:
  - Overall rating (1-5 stars)
  - Service quality
  - Barber professionalism
  - Cleanliness
  - Value for money
  - Would recommend to friends

#### Feedback Features
- **Detailed Comments**: Share your experience (up to 500 characters)
- **Photo Upload**: Add up to 5 images to illustrate your review
- **Anonymous Option**: Hide your name from public display
- **Edit Window**: Modify feedback within 7 days of submission

#### View Your Feedback (`/my-feedback`)
- **Feedback History**: See all your past reviews
- **Status Tracking**: Monitor approval status
- **Business Responses**: Read replies from the barbershop
- **Edit Options**: Update recent feedback if still pending

---

## ✂️ Barber Features

### 1. Initial Setup (`/barber/setup`)
- **First-time Configuration**: Enter your Barber ID (provided by admin)
- **Profile Verification**: Confirm your barber profile details
- **Dashboard Access**: Gain access to barber-specific features

### 2. Dashboard (`/barber/dashboard`)

#### Overview Statistics
- **Today's Performance**: Completed vs. total bookings
- **Revenue Tracking**: Daily earnings from completed services
- **Rating Display**: Current average rating from customers
- **Pending Alerts**: Number of bookings awaiting confirmation

#### Quick Actions
- **Today's Schedule**: View and manage current day appointments
- **Upcoming Bookings**: Timeline of next 7 days
- **Status Updates**: Confirm, complete, or mark no-shows
- **Navigation Shortcuts**: Quick access to all barber features

### 3. Calendar View (`/barber/calendar`)

#### Interactive Calendar
- **Monthly View**: See all bookings and availability at a glance
- **Color-coded Status**: Visual indicators for different booking states
- **Click for Details**: Select any date to see detailed booking information
- **Navigation**: Move between months easily

#### Daily Management
- **Booking Actions**:
  - **Confirm**: Accept pending bookings
  - **Complete**: Mark services as finished
  - **No-show**: Record when customers don't attend
- **Customer Information**: View contact details and service notes
- **Time Management**: See duration and scheduling conflicts

### 4. Booking Management (`/barber/bookings`)

#### Advanced Filtering
- **Customer Search**: Find bookings by customer name
- **Status Filter**: View specific booking types
- **Date Range**: Filter by custom time periods
- **Service Type**: Filter by specific services offered

#### Bulk Operations
- **Status Updates**: Change multiple booking statuses
- **Customer Communication**: Access contact information
- **Service History**: View customer's previous visits
- **Performance Tracking**: Monitor completion rates

### 5. Customer Feedback Management

#### View Feedback
- **Rating Overview**: See your average ratings and distribution
- **Detailed Reviews**: Read customer comments and suggestions
- **Photo Reviews**: View images customers shared
- **Trend Analysis**: Track rating improvements over time

#### Respond to Feedback
- **Business Responses**: Reply to customer reviews professionally
- **Address Concerns**: Respond to negative feedback constructively
- **Thank Customers**: Acknowledge positive reviews
- **Build Relationships**: Use feedback to improve service quality

---

## 👨‍💼 Admin Features

### 1. Barber Schedule Management (`/admin/barber-schedule`)

#### Calendar Overview
- **Multi-barber View**: See all barber schedules simultaneously
- **Absence Tracking**: Monitor barber availability
- **Booking Conflicts**: Identify and resolve scheduling issues
- **Performance Metrics**: Track individual barber productivity

#### Absence Management
- **Create Absence**: Mark barbers as unavailable
- **Absence Types**: Sick leave, vacation, emergency, training, personal
- **Affected Bookings**: Automatically identify impacted appointments
- **Rescheduling Tools**: Help customers reschedule affected bookings

#### Conflict Resolution
- **Booking Conflicts**: Identify overlapping appointments
- **Resolution Options**: Reschedule or reassign bookings
- **Customer Communication**: Notify affected customers
- **Alternative Solutions**: Suggest different barbers or times

### 2. Feedback Moderation

#### Review Management
- **Approval Workflow**: Review and approve customer feedback
- **Content Moderation**: Ensure appropriate language and content
- **Spam Prevention**: Filter out fake or inappropriate reviews
- **Quality Control**: Maintain high standards for public feedback

#### Analytics and Reporting
- **Rating Trends**: Track overall customer satisfaction
- **Barber Performance**: Compare individual barber ratings
- **Service Quality**: Analyze feedback by service type
- **Improvement Areas**: Identify areas needing attention

---

## 🔧 Technical Features

### Real-time Updates
- **Live Availability**: Booking slots update in real-time
- **Instant Notifications**: Immediate status change alerts
- **Conflict Prevention**: Automatic double-booking prevention
- **Synchronization**: All users see current information

### Mobile Optimization
- **Responsive Design**: Works perfectly on all devices
- **Touch-friendly**: Optimized for mobile interactions
- **Fast Loading**: Efficient performance on mobile networks
- **Offline Capability**: Basic functionality without internet

### Security Features
- **User Authentication**: Secure login for all user types
- **Data Protection**: Personal information kept private
- **Role-based Access**: Users only see relevant features
- **Audit Trail**: Track all system changes and actions

---

## 🚀 Getting Started

### For Customers
1. **Register/Login**: Create account or sign in
2. **Browse Services**: Explore available options
3. **Book Appointment**: Follow the 4-step booking process
4. **Manage Bookings**: Track and modify your appointments
5. **Provide Feedback**: Share your experience after service

### For Barbers
1. **Setup Profile**: Complete initial barber setup
2. **Access Dashboard**: View your daily overview
3. **Manage Schedule**: Use calendar to track appointments
4. **Update Bookings**: Confirm and complete services
5. **Engage with Feedback**: Respond to customer reviews

### For Admins
1. **Monitor System**: Oversee all bookings and schedules
2. **Manage Absences**: Handle barber availability
3. **Resolve Conflicts**: Fix scheduling issues
4. **Moderate Content**: Review and approve feedback
5. **Generate Reports**: Analyze system performance

---

## 📞 Support and Help

### Common Issues
- **Booking Conflicts**: Contact admin for resolution
- **Payment Issues**: Check with customer service
- **Technical Problems**: Clear browser cache and retry
- **Account Access**: Use password reset or contact support

### Contact Information
- **Customer Support**: Available during business hours
- **Technical Help**: Online documentation and tutorials
- **Feedback**: Share suggestions for system improvements
- **Emergency**: Contact admin for urgent scheduling issues

---

## 🔄 System Updates

The booking system is continuously improved with new features and enhancements. Regular updates include:

- **New Service Options**: Additional treatments and packages
- **Enhanced Filtering**: More precise search capabilities
- **Improved Analytics**: Better reporting and insights
- **Mobile Features**: Enhanced mobile experience
- **Integration Options**: Connect with external systems

---

*This guide covers all major features of the barbershop booking system. For specific questions or additional help, please contact your system administrator or customer support team.*
