const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db');
const productRoutes = require('./Routes/productRoutes');
const authRoutes = require("./Routes/authRoutes");
const cartRoutes = require("./Routes/cartRoutes");
const addressRoutes = require("./Routes/addressRoutes");

dotenv.config();
console.log("ENV loaded:", {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? "Loaded" : "Missing",
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

connectDB();

app.use('/api', productRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/addresses", addressRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
