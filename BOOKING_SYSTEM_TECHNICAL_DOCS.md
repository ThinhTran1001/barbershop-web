# 🔧 Barbershop Booking System - Technical Documentation

## 📋 System Architecture

### Technology Stack
- **Frontend**: React.js with Ant Design UI components
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication system
- **File Upload**: Multer for image handling
- **Real-time Updates**: WebSocket support ready

### Project Structure
```
barbershop-booking/
├── front-end/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service functions
│   │   ├── context/           # React context providers
│   │   └── route.jsx          # Application routing
├── back-end/
│   ├── models/                # MongoDB schemas
│   ├── controllers/           # Business logic
│   ├── routes/                # API endpoints
│   ├── middlewares/           # Custom middleware
│   └── server.js              # Application entry point
```

---

## 🗄️ Database Schema

### Core Models

#### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: ['customer', 'barber', 'admin'],
  avatarUrl: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Service Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  durationMinutes: Number,
  category: String,
  hairTypes: [String],           // ['straight', 'wavy', 'curly', 'coily']
  styleCompatibility: [String],  // ['short', 'medium', 'long', 'beard']
  expertiseRequired: [String],   // ['fade', 'coloring', 'beard']
  steps: [String],
  isActive: Boolean,
  popularity: Number,
  averageRating: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Barber Model
```javascript
{
  userId: ObjectId (ref: User),
  specialties: [String],
  experienceYears: Number,
  isAvailable: Boolean,
  averageRating: Number,
  totalBookings: Number,
  workingSince: Date,
  expertiseTags: [String],
  hairTypeExpertise: [String],
  styleExpertise: [String],
  autoAssignmentEligible: Boolean,
  maxDailyBookings: Number,
  preferredWorkingHours: {
    start: String,
    end: String
  },
  profileImageUrl: String,
  certifications: [String],
  languages: [String]
}
```

#### Booking Model
```javascript
{
  customerId: ObjectId (ref: User),
  barberId: ObjectId (ref: Barber),
  serviceId: ObjectId (ref: Service),
  bookingDate: Date,
  durationMinutes: Number,
  status: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
  note: String,
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  notificationMethods: [String],
  autoAssignedBarber: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### BookingFeedback Model
```javascript
{
  bookingId: ObjectId (ref: Booking, unique),
  customerId: ObjectId (ref: User),
  barberId: ObjectId (ref: Barber),
  serviceId: ObjectId (ref: Service),
  rating: Number (1-5),
  serviceQuality: Number (1-5),
  barberProfessionalism: Number (1-5),
  cleanliness: Number (1-5),
  valueForMoney: Number (1-5),
  wouldRecommend: Number (1-5),
  comment: String,
  images: [{
    url: String,
    caption: String,
    uploadedAt: Date
  }],
  status: ['pending', 'approved', 'rejected', 'hidden'],
  isPublic: Boolean,
  isAnonymous: Boolean,
  helpfulVotes: Number,
  unhelpfulVotes: Number,
  businessResponse: {
    message: String,
    respondedBy: ObjectId (ref: User),
    respondedAt: Date
  },
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Supporting Models

#### BarberSchedule Model
```javascript
{
  barberId: ObjectId (ref: Barber),
  date: String, // "YYYY-MM-DD"
  workingHours: {
    start: String,
    end: String
  },
  availableSlots: [{
    time: String,
    isBooked: Boolean,
    bookingId: ObjectId (ref: Booking),
    isBlocked: Boolean,
    blockReason: String
  }],
  isOffDay: Boolean,
  offReason: String,
  slotDuration: Number,
  breakTimes: [{
    start: String,
    end: String,
    reason: String
  }]
}
```

#### BarberAbsence Model
```javascript
{
  barberId: ObjectId (ref: Barber),
  startDate: Date,
  endDate: Date,
  reason: ['sick_leave', 'vacation', 'emergency', 'training', 'personal', 'other'],
  description: String,
  isApproved: Boolean,
  approvedBy: ObjectId (ref: User),
  affectedBookings: [{
    bookingId: ObjectId (ref: Booking),
    originalDate: Date,
    newDate: Date,
    status: String,
    newBarberId: ObjectId (ref: Barber)
  }],
  createdBy: ObjectId (ref: User)
}
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update user profile
```

### Services
```
GET    /api/services                    # Get all services (with filters)
POST   /api/services                    # Create new service
PUT    /api/services/:id                # Update service
DELETE /api/services/:id                # Delete service
GET    /api/services/suggestions        # Get personalized suggestions
GET    /api/services/categories         # Get service categories
GET    /api/services/hair-types         # Get hair types
GET    /api/services/style-compatibility # Get style options
GET    /api/services/search             # Search services
```

### Barbers
```
GET  /api/barbers                    # Get all barbers (with filters)
POST /api/barbers                    # Create barber profile
PUT  /api/barbers/:id                # Update barber profile
GET  /api/barbers/:id                # Get barber details
POST /api/barbers/auto-assign       # Auto-assign barber
GET  /api/barbers/availability       # Get barber availability
GET  /api/barbers/:id/bookings       # Get barber bookings
```

### Bookings
```
POST /api/bookings                      # Create new booking
GET  /api/bookings/me                   # Get user's bookings
PUT  /api/bookings/:id/status           # Update booking status
PUT  /api/bookings/:id/cancel           # Cancel booking
POST /api/bookings/check-availability   # Check time slot availability
GET  /api/bookings/conflicts            # Get booking conflicts (admin)
```

### Feedback
```
POST /api/booking-feedback                    # Create feedback
GET  /api/booking-feedback/booking/:id        # Get booking feedback
GET  /api/booking-feedback/barber/:id         # Get barber feedback
GET  /api/booking-feedback/service/:id        # Get service feedback
PUT  /api/booking-feedback/:id               # Update feedback
POST /api/booking-feedback/:id/helpful       # Mark feedback helpful
POST /api/booking-feedback/:id/response      # Add business response
GET  /api/booking-feedback/my-feedback       # Get customer feedback history
```

### Admin
```
GET  /api/barber-absences              # Get barber absences
POST /api/barber-absences              # Create barber absence
PUT  /api/barber-absences/:id/approval # Approve/reject absence
PUT  /api/barber-absences/:id/reschedule # Reschedule affected bookings
GET  /api/barber-absences/calendar     # Get barber calendar
```

---

## 🔐 Authentication & Authorization

### JWT Implementation
```javascript
// Token structure
{
  userId: "user_id",
  role: "customer|barber|admin",
  iat: timestamp,
  exp: timestamp
}

// Middleware usage
const { authenticate } = require('./middlewares/auth.middleware');
router.get('/protected-route', authenticate, controller.method);
```

### Role-based Access Control
```javascript
// Role checking
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Usage
router.get('/admin-only', authenticate, checkRole(['admin']), controller.method);
```

---

## 🎨 Frontend Architecture

### Component Structure
```
components/
├── Header/
│   ├── UserHeader.jsx
│   ├── BarberHeader.jsx
│   └── AdminHeader.jsx
├── ServiceItem.jsx
├── BarberList.jsx
├── FeedbackDisplay.jsx
└── Layout/
    ├── UserLayout.jsx
    ├── BarberLayout.jsx
    └── AdminLayout.jsx
```

### State Management
```javascript
// Context providers
├── AuthContext.jsx          # User authentication state
├── BookingContext.jsx       # Booking flow state
└── NotificationContext.jsx  # App notifications

// Usage
const { user, login, logout } = useAuth();
const { selectedService, setSelectedService } = useBooking();
```

### API Services
```javascript
// Service structure
services/
├── serviceApi.js           # Service-related API calls
├── barberApi.js           # Barber-related API calls
├── bookingFeedbackApi.js  # Feedback API calls
└── barberAbsenceApi.js    # Admin absence management

// Usage
import { fetchAllServices, createBooking } from '../services/serviceApi';
```

---

## 🔄 Business Logic

### Booking Flow
1. **Service Selection**: Customer chooses service with filters
2. **Barber Selection**: Manual selection or auto-assignment
3. **Time Slot Selection**: Real-time availability checking
4. **Booking Creation**: Validation and conflict prevention
5. **Status Management**: Pending → Confirmed → Completed

### Auto-Assignment Algorithm
```javascript
// Barber matching criteria
1. Service expertise requirements
2. Hair type compatibility
3. Style expertise
4. Current workload
5. Customer preferences
6. Rating and experience
7. Availability score calculation
```

### Conflict Prevention
```javascript
// Validation checks
1. Time slot availability
2. Barber absence periods
3. Daily booking limits
4. Minimum advance booking time
5. Overlapping appointment detection
```

### Rating System
```javascript
// Automatic updates
1. Feedback submission triggers barber rating update
2. Service popularity tracking
3. Customer satisfaction metrics
4. Performance analytics calculation
```

---

## 🚀 Deployment & Configuration

### Environment Variables
```bash
# Backend (.env)
PORT=3000
MONGODB_URI=mongodb://localhost:27017/barbershop
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5MB

# Frontend (.env)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_UPLOAD_URL=http://localhost:3000/uploads
```

### Database Indexes
```javascript
// Performance optimization
db.bookings.createIndex({ customerId: 1, bookingDate: -1 });
db.bookings.createIndex({ barberId: 1, bookingDate: 1 });
db.bookingfeedbacks.createIndex({ barberId: 1, status: 1, createdAt: -1 });
db.services.createIndex({ category: 1, isActive: 1 });
db.barbers.createIndex({ expertiseTags: 1, isAvailable: 1 });
```

### Production Considerations
- **Database Connection Pooling**: Configure MongoDB connection limits
- **File Upload Storage**: Use cloud storage (AWS S3, Cloudinary)
- **Caching**: Implement Redis for frequently accessed data
- **Rate Limiting**: Prevent API abuse
- **Error Logging**: Comprehensive error tracking
- **Backup Strategy**: Regular database backups
- **SSL/HTTPS**: Secure data transmission
- **CDN**: Static asset delivery optimization

---

## 🧪 Testing

### Unit Tests
```javascript
// Example test structure
describe('Booking Controller', () => {
  test('should create booking successfully', async () => {
    // Test implementation
  });
  
  test('should prevent double booking', async () => {
    // Test implementation
  });
});
```

### Integration Tests
- API endpoint testing
- Database operation validation
- Authentication flow testing
- Business logic verification

### Frontend Testing
- Component rendering tests
- User interaction testing
- API integration testing
- Responsive design validation

---

## 📊 Monitoring & Analytics

### Key Metrics
- **Booking Conversion Rate**: Service views to bookings
- **Customer Satisfaction**: Average feedback ratings
- **Barber Utilization**: Booking efficiency per barber
- **System Performance**: API response times
- **Error Rates**: Failed operations tracking

### Logging Strategy
```javascript
// Log levels and categories
- ERROR: System errors and exceptions
- WARN: Business logic warnings
- INFO: Important business events
- DEBUG: Detailed operation logs
```

---

## 🔧 Maintenance & Updates

### Regular Tasks
- **Database Cleanup**: Remove old temporary data
- **Performance Monitoring**: Track slow queries
- **Security Updates**: Keep dependencies current
- **Backup Verification**: Test restore procedures
- **User Feedback Review**: Analyze feature requests

### Feature Development
- **Version Control**: Git workflow with feature branches
- **Code Review**: Peer review process
- **Testing Pipeline**: Automated testing before deployment
- **Documentation Updates**: Keep docs synchronized with code

---

*This technical documentation provides comprehensive information for developers working with the barbershop booking system. For specific implementation details, refer to the source code and inline comments.*
