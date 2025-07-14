# 📡 API Reference - Barbershop Booking System

## 🔗 Base URL
```
http://localhost:3000/api
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0123456789",
  "role": "customer"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "token": "jwt_token_here"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "token": "jwt_token_here"
}
```

---

## 🛍️ Services API

#### Get All Services
```http
GET /services?category=Cut&hairType=straight&minPrice=100000&maxPrice=300000&page=1&limit=10
```

**Query Parameters:**
- `category` (optional): Service category
- `hairType` (optional): Compatible hair type
- `styleCompatibility` (optional): Compatible style
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `searchQuery` (optional): Search in name/description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "services": [
    {
      "_id": "service_id",
      "name": "Cắt tóc nam cơ bản",
      "description": "Cắt tóc nam phong cách cơ bản",
      "price": 150000,
      "durationMinutes": 30,
      "category": "Cut",
      "hairTypes": ["straight", "wavy"],
      "styleCompatibility": ["short", "medium"],
      "expertiseRequired": [],
      "averageRating": 4.5,
      "popularity": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Service Suggestions
```http
GET /services/suggestions?hairType=straight&stylePreference=short&userId=user_id&limit=5
```

**Response:**
```json
{
  "suggestions": [
    {
      "_id": "service_id",
      "name": "Cắt tóc nam hiện đại",
      "price": 200000,
      "matchScore": 0.95,
      "reason": "Perfect match for your hair type and style preference"
    }
  ]
}
```

#### Get Service Categories
```http
GET /services/categories
```

**Response:**
```json
["Cut", "Perm", "Color", "Combo", "Styling", "Treatment"]
```

---

## ✂️ Barbers API

#### Get All Barbers
```http
GET /barbers?expertiseTags=fade&minRating=4&isAvailable=true&page=1&limit=10
```

**Query Parameters:**
- `expertiseTags` (optional): Array of expertise tags
- `hairTypeExpertise` (optional): Hair type specialization
- `styleExpertise` (optional): Style specialization
- `minRating` (optional): Minimum rating filter
- `minExperience` (optional): Minimum years of experience
- `isAvailable` (optional): Availability status
- `autoAssignmentEligible` (optional): Auto-assignment eligibility

**Response:**
```json
{
  "barbers": [
    {
      "_id": "barber_id",
      "userId": {
        "name": "Nguyễn Văn A",
        "email": "barber@example.com",
        "phone": "0123456789"
      },
      "specialties": ["Cắt tóc nam", "Tạo kiểu"],
      "experienceYears": 5,
      "averageRating": 4.7,
      "totalBookings": 150,
      "expertiseTags": ["fade", "modern_cuts"],
      "isAvailable": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "pages": 1
  }
}
```

#### Auto-Assign Barber
```http
POST /barbers/auto-assign
Content-Type: application/json
Authorization: Bearer <token>

{
  "serviceId": "service_id",
  "bookingDate": "2024-01-15T10:00:00.000Z",
  "customerPreferences": {
    "hairType": "straight",
    "stylePreference": "short"
  }
}
```

**Response:**
```json
{
  "assignedBarber": {
    "id": "barber_id",
    "name": "Nguyễn Văn A",
    "averageRating": 4.7,
    "experienceYears": 5,
    "availabilityScore": 0.92
  },
  "alternativeBarbers": [
    {
      "id": "barber_id_2",
      "name": "Trần Văn B",
      "averageRating": 4.5
    }
  ],
  "assignmentReason": "Auto-assigned based on service requirements and availability"
}
```

---

## 📅 Bookings API

#### Create Booking
```http
POST /bookings
Content-Type: application/json
Authorization: Bearer <token>

{
  "barberId": "barber_id",
  "serviceId": "service_id",
  "bookingDate": "2024-01-15T10:00:00.000Z",
  "durationMinutes": 30,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "0123456789",
  "note": "Please use organic products",
  "notificationMethods": ["email", "sms"]
}
```

**Response:**
```json
{
  "booking": {
    "_id": "booking_id",
    "customerId": "customer_id",
    "barberId": "barber_id",
    "serviceId": "service_id",
    "bookingDate": "2024-01-15T10:00:00.000Z",
    "status": "pending",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "0123456789",
    "createdAt": "2024-01-10T08:00:00.000Z"
  },
  "message": "Booking created successfully"
}
```

#### Get My Bookings
```http
GET /bookings/me?status=completed&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "bookings": [
    {
      "_id": "booking_id",
      "serviceId": {
        "name": "Cắt tóc nam cơ bản",
        "price": 150000
      },
      "barberId": {
        "userId": {
          "name": "Nguyễn Văn A"
        },
        "averageRating": 4.7
      },
      "bookingDate": "2024-01-15T10:00:00.000Z",
      "status": "completed",
      "customerName": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### Update Booking Status
```http
PUT /bookings/:bookingId/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "confirmed",
  "reason": "Booking confirmed by barber"
}
```

#### Cancel Booking
```http
PUT /bookings/:bookingId/cancel
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Schedule conflict"
}
```

#### Check Availability
```http
POST /bookings/check-availability
Content-Type: application/json
Authorization: Bearer <token>

{
  "barberId": "barber_id",
  "bookingDate": "2024-01-15T10:00:00.000Z",
  "durationMinutes": 30
}
```

**Response:**
```json
{
  "available": true,
  "message": "Time slot is available"
}
```

---

## ⭐ Feedback API

#### Create Feedback
```http
POST /booking-feedback
Content-Type: application/json
Authorization: Bearer <token>

{
  "bookingId": "booking_id",
  "rating": 5,
  "serviceQuality": 5,
  "barberProfessionalism": 5,
  "cleanliness": 4,
  "valueForMoney": 4,
  "wouldRecommend": 5,
  "comment": "Excellent service! Very professional and friendly.",
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "caption": "Final result"
    }
  ],
  "isAnonymous": false
}
```

**Response:**
```json
{
  "feedback": {
    "_id": "feedback_id",
    "bookingId": "booking_id",
    "customerId": "customer_id",
    "barberId": "barber_id",
    "rating": 5,
    "comment": "Excellent service!",
    "status": "approved",
    "createdAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Feedback submitted successfully"
}
```

#### Get Barber Feedback
```http
GET /booking-feedback/barber/:barberId?page=1&limit=10&rating=5
```

**Response:**
```json
{
  "feedback": [
    {
      "_id": "feedback_id",
      "customerId": {
        "name": "John Doe"
      },
      "rating": 5,
      "comment": "Excellent service!",
      "serviceQuality": 5,
      "barberProfessionalism": 5,
      "createdAt": "2024-01-15T12:00:00.000Z",
      "helpfulVotes": 3,
      "businessResponse": {
        "message": "Thank you for your feedback!",
        "respondedAt": "2024-01-15T14:00:00.000Z"
      }
    }
  ],
  "stats": {
    "averageRating": 4.7,
    "totalReviews": 25,
    "averageServiceQuality": 4.8,
    "averageBarberProfessionalism": 4.9,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 7,
      "5": 15
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Mark Feedback Helpful
```http
POST /booking-feedback/:feedbackId/helpful
Content-Type: application/json
Authorization: Bearer <token>

{
  "isHelpful": true
}
```

#### Add Business Response
```http
POST /booking-feedback/:feedbackId/response
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Thank you for your feedback! We're glad you enjoyed our service."
}
```

---

## 🏥 Admin API

#### Get Barber Absences
```http
GET /barber-absences?barberId=barber_id&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Create Barber Absence
```http
POST /barber-absences
Content-Type: application/json
Authorization: Bearer <token>

{
  "barberId": "barber_id",
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-01-22T23:59:59.999Z",
  "reason": "sick_leave",
  "description": "Medical appointment and recovery"
}
```

#### Get Barber Calendar
```http
GET /barber-absences/calendar?barberId=barber_id&month=1&year=2024
Authorization: Bearer <token>
```

**Response:**
```json
{
  "barberId": "barber_id",
  "month": 1,
  "year": 2024,
  "calendar": [
    {
      "date": "2024-01-15",
      "isAbsent": false,
      "bookingsCount": 5,
      "totalBookedMinutes": 180,
      "availableMinutes": 300
    }
  ],
  "absences": [
    {
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-01-22T23:59:59.999Z",
      "reason": "sick_leave"
    }
  ]
}
```

---

## 🚨 Error Responses

### Standard Error Format
```json
{
  "message": "Error description",
  "error": "Detailed error information",
  "statusCode": 400
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

### Example Error Responses

#### Validation Error
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "statusCode": 400
}
```

#### Authentication Error
```json
{
  "message": "Authentication required",
  "statusCode": 401
}
```

#### Booking Conflict
```json
{
  "message": "Time slot conflicts with existing booking",
  "conflictingBooking": {
    "date": "2024-01-15T10:00:00.000Z",
    "duration": 30
  },
  "statusCode": 409
}
```

---

## 📝 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File upload endpoints**: 10 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

*This API reference provides comprehensive information for integrating with the barbershop booking system. For additional details or custom implementations, refer to the technical documentation.*
