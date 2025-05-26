const express = require("express");
const app = express();
require('dotenv').config();
const cors = require('cors')
const PORT = process.env.PORT;
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const brandRoutes = require("./routes/brand.route");
const userRoutes = require("./routes/user.route")
const barberRoutes = require("./routes/barber.route")
const connectDB = require('./config/db')

app.use(cors())
app.use(express.json())



app.use('/api/admin', productRoutes);
app.use('/api/admin', categoryRoutes);
app.use('/api/admin', brandRoutes);
app.use('/api/admin', userRoutes);
app.use('/api/admin', barberRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    connectDB();
});
