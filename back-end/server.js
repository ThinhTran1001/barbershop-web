const express = require("express");
const app = express();
const PORT = 3000;
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const brandRoutes = require("./routes/brand.route");

app.use('/api/admin', productRoutes);
app.use('/api/admin', categoryRoutes);
app.use('/api/admin', brandRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
