const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db.config');
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const brandRoutes = require("./routes/brand.route");
const authRoutes = require("./routes/auth.route");

const cors = require('cors');

// Load biến môi trường từ .env
dotenv.config();

const app = express();

// Middleware để parse JSON
app.use(express.json());
app.use(cors());

// Kết nối MongoDB
connectDB();
const kafkaConsumer = require('./services/kafka-consumer.service');
kafkaConsumer().then(() => console.log('Kafka consumer running'));

app.use('/api/admin', productRoutes);
app.use('/api/admin', categoryRoutes);
app.use('/api/admin', brandRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
