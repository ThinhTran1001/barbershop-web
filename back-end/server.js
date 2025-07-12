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

const cors = require('cors');
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

connectDB();
const kafkaConsumer = require('./services/kafka-consumer.service');
kafkaConsumer().then(() => console.log('Kafka consumer running'));

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
app.use('/api/discounts', discountRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/feedback-orders', feedbackOrderRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    connectDB();
});