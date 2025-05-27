const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db.config');
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const brandRoutes = require("./routes/brand.route");
const authRoutes = require("./routes/auth.route");
const serviceRoutes = require('./routes/service.route');
const barberRoutes = require("./routes/barber.routes");
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


app.use("/api/barbers", barberRoutes);  
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});