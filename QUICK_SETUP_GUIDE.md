# 🚀 Quick Setup Guide - Barbershop Booking System

## 📋 Prerequisites

Before setting up the system, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🔧 Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd barbershop-booking-system
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd back-end
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
Create a `.env` file in the `back-end` directory:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/barbershop_booking
DB_NAME=barbershop_booking

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS
FRONTEND_URL=http://localhost:3001
```

#### Start MongoDB
```bash
# If using local MongoDB
mongod

# Or if using MongoDB service
sudo systemctl start mongod
```

#### Initialize Database (Optional)
```bash
# Create sample data
npm run seed
```

#### Start Backend Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend server will start on `http://localhost:3000`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../front-end
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
Create a `.env` file in the `front-end` directory:
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_UPLOAD_URL=http://localhost:3000/uploads

# App Configuration
REACT_APP_NAME=Barbershop Booking System
REACT_APP_VERSION=1.0.0
```

#### Start Frontend Development Server
```bash
npm start
```

The frontend will start on `http://localhost:3001`

## 🗄️ Database Setup

### 1. Create Database Collections
The system will automatically create collections when you first run it, but you can manually create them:

```javascript
// Connect to MongoDB
use barbershop_booking

// Create collections
db.createCollection("users")
db.createCollection("services")
db.createCollection("barbers")
db.createCollection("bookings")
db.createCollection("bookingfeedbacks")
db.createCollection("barberschedules")
db.createCollection("barberabsences")
```

### 2. Create Sample Data

#### Sample Admin User
```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@barbershop.com",
  password: "$2b$10$hashed_password_here", // Use bcrypt to hash "admin123"
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### Sample Services
```javascript
db.services.insertMany([
  {
    name: "Cắt tóc nam cơ bản",
    description: "Cắt tóc nam phong cách cơ bản, gọn gàng",
    price: 150000,
    durationMinutes: 30,
    category: "Cut",
    hairTypes: ["straight", "wavy"],
    styleCompatibility: ["short", "medium"],
    expertiseRequired: [],
    isActive: true,
    popularity: 0,
    averageRating: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Cắt tóc + Gội đầu",
    description: "Combo cắt tóc và gội đầu massage thư giãn",
    price: 200000,
    durationMinutes: 45,
    category: "Combo",
    hairTypes: ["straight", "wavy", "curly"],
    styleCompatibility: ["short", "medium", "long"],
    expertiseRequired: [],
    isActive: true,
    popularity: 0,
    averageRating: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

#### Sample Barber
```javascript
// First create a user for the barber
db.users.insertOne({
  name: "Nguyễn Văn A",
  email: "barber1@barbershop.com",
  password: "$2b$10$hashed_password_here", // Use bcrypt to hash "barber123"
  role: "barber",
  phone: "0123456789",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Then create the barber profile
db.barbers.insertOne({
  userId: ObjectId("user_id_from_above"),
  specialties: ["Cắt tóc nam", "Tạo kiểu"],
  experienceYears: 5,
  isAvailable: true,
  averageRating: 0,
  totalBookings: 0,
  workingSince: new Date("2019-01-01"),
  expertiseTags: ["fade", "modern_cuts"],
  hairTypeExpertise: ["straight", "wavy"],
  styleExpertise: ["short", "medium"],
  autoAssignmentEligible: true,
  maxDailyBookings: 10,
  preferredWorkingHours: {
    start: "08:00",
    end: "18:00"
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🔑 Default Accounts

After setup, you can use these default accounts:

### Admin Account
- **Email**: admin@barbershop.com
- **Password**: admin123
- **Role**: Administrator

### Barber Account
- **Email**: barber1@barbershop.com
- **Password**: barber123
- **Role**: Barber

### Customer Account
- **Register**: Create new customer account through the registration form

## 🧪 Testing the System

### 1. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api

### 2. Test User Flows

#### Customer Flow
1. Register/Login as customer
2. Browse services at `/services`
3. Book a service following the 4-step process
4. View bookings at `/my-booking`
5. Complete a booking and leave feedback

#### Barber Flow
1. Login as barber
2. Go to `/barber/setup` and enter barber ID
3. Access dashboard at `/barber/dashboard`
4. View calendar at `/barber/calendar`
5. Manage bookings at `/barber/bookings`

#### Admin Flow
1. Login as admin
2. Access admin panel at `/admin`
3. Manage barber schedules at `/admin/barber-schedule`
4. Monitor system performance

## 🔧 Configuration Options

### Backend Configuration

#### Database Connection
```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

#### CORS Configuration
```javascript
// server.js
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Frontend Configuration

#### API Base URL
```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

#### Routing Configuration
```javascript
// src/route.jsx
// All routes are already configured
// Modify as needed for your specific requirements
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check if port 3000 is available
lsof -i :3000

# Check environment variables
cat .env
```

#### Frontend Won't Start
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Check for port conflicts
lsof -i :3001
```

#### Database Connection Issues
```bash
# Check MongoDB status
mongo --eval "db.adminCommand('ismaster')"

# Check database name and URI
echo $MONGODB_URI
```

#### CORS Errors
- Ensure frontend URL is correctly set in backend `.env`
- Check that both servers are running on correct ports
- Verify CORS configuration in `server.js`

### Performance Optimization

#### Database Indexes
```javascript
// Run these commands in MongoDB shell
db.bookings.createIndex({ customerId: 1, bookingDate: -1 })
db.bookings.createIndex({ barberId: 1, bookingDate: 1 })
db.bookingfeedbacks.createIndex({ barberId: 1, status: 1 })
db.services.createIndex({ category: 1, isActive: 1 })
```

#### Frontend Optimization
```bash
# Build for production
npm run build

# Serve production build
npm install -g serve
serve -s build -l 3001
```

## 📚 Next Steps

After successful setup:

1. **Customize Services**: Add your specific services and pricing
2. **Configure Barbers**: Set up your barber profiles and schedules
3. **Customize UI**: Modify colors, logos, and branding
4. **Set up Email**: Configure email notifications (optional)
5. **Deploy**: Prepare for production deployment

## 🆘 Support

If you encounter issues during setup:

1. **Check Logs**: Look at console output for error messages
2. **Verify Prerequisites**: Ensure all required software is installed
3. **Review Configuration**: Double-check all environment variables
4. **Test Connections**: Verify database and API connectivity
5. **Consult Documentation**: Refer to technical documentation for details

---

*This quick setup guide should get your barbershop booking system up and running. For detailed feature usage, refer to the User Guide documentation.*
