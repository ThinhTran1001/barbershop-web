// server.js
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db.config');
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const brandRoutes = require("./routes/brand.route");
const authRoutes = require("./routes/auth.route");
const serviceRoutes = require('./routes/service.route');
const userRoutes = require('./routes/user.route');
const barberRoutes = require('./routes/barber.route');
const voucherRoutes = require('./routes/voucher.route');
const orderRoutes = require('./routes/order.route');
const userVoucherRoutes = require('./routes/user_voucher.route');
const cartRoutes = require('./routes/cart.route');
const chatbotAI = require('./routes/chatbot.route');
const updaloadRoutes = require('./routes/upload.route');
const reviewRoutes = require('./routes/productreview.route');
const feedbackBarberRoutes = require('./routes/feedbackBarber.route');
const discountRoutes = require('./routes/discounts.route');
const bookingRoutes = require('./routes/booking.route');
const feedbackOrderRoutes = require('./routes/feedbackOrder.route');
const barberAbsenceRoutes = require('./routes/barber-absence.route');
const barberScheduleRoutes = require('./routes/barberSchedule.route');
const bookingFeedbackRoutes = require('./routes/booking-feedback.route');
const feedbackBookingRoutes = require('./routes/feedbackBooking.route');
const blogRoutes = require('./routes/blog.route');
const contactRoutes = require('./routes/contact.route');
const statisticRoutes = require('./routes/statistic.route');
const chatRoutes = require('./routes/chat.route');

const cors = require('cors');
const cookieParser = require("cookie-parser");
const http = require('http');
const { initSocket } = require('./services/socket.service');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

connectDB();
const kafkaConsumer = require('./services/kafka-consumer.service');
kafkaConsumer().then(() => console.log('Kafka consumer running'));
const ScheduleInitializerService = require('./services/schedule-initializer.service');

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user-vouchers', userVoucherRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/chatbot', chatbotAI);
app.use('/api/upload', updaloadRoutes);
app.use('/api/product-reviews', reviewRoutes);
app.use('/api/feedback-barber', feedbackBarberRoutes);
app.use('/api/feedback-booking', feedbackBookingRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/feedback-orders', feedbackOrderRoutes);
app.use('/api/barber-absences', barberAbsenceRoutes);
app.use('/api/barber-schedule', barberScheduleRoutes);
app.use('/api/booking-feedback', bookingFeedbackRoutes);
app.use('/api/feedback-bookings', feedbackBookingRoutes);
app.use('/api/news', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/statistics', statisticRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;
initSocket(server); 
server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    connectDB();

    // Khởi tạo schedule cho các barber khi server khởi động
    try {
        console.log('Initializing barber schedules...');
        await ScheduleInitializerService.initializeSchedules(7); // Tạo schedule cho 7 ngày tới
        console.log('Barber schedules initialized successfully');
    } catch (error) {
        console.error('Error initializing barber schedules:', error);
    }
});