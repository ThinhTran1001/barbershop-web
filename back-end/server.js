const express = require("express");
const app = express();

require('dotenv').config();

const authRoutes = require("./routes/auth.route");
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const brandRoutes = require("./routes/brand.route");

const connectDB = require("./config/database");
const kafkaConsumer = require('./services/kafka-consumer.service');

connectDB().then(() => console.log('MongoDB connected'));
kafkaConsumer().then(() => console.log('Kafka consumer running'));

app.use('/api/admin', productRoutes);
app.use('/api/admin', categoryRoutes);
app.use('/api/admin', brandRoutes);
app.use('/api/auth', authRoutes);


app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});
