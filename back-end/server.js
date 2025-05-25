const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db.config');
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const brandRoutes = require("./routes/brand.route");
const authRoutes = require("./routes/auth.route");
const serviceRoutes = require('./routes/service.route');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

connectDB();
const kafkaConsumer = require('./services/kafka-consumer.service');
kafkaConsumer().then(() => console.log('Kafka consumer running'));

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});