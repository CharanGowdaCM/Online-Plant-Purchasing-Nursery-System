// routes/index.js
const express = require("express");
const router = express.Router();

// Authentication & User Management
const authRoutes = require("./auth");
const userRoutes = require("./userRoutes");
const adminRoutes = require("./admin");

// Product & Shopping
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");


// Payment Processing
const paymentRoutes = require("./paymentRoutes");
const webhookRoutes = require('./webhookRoutes');

// Mount Authentication & User routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes); // This includes all admin subroutes

// Mount Shopping routes
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);


// Mount Payment routes
router.use("/payments", paymentRoutes);
router.use('/webhooks', webhookRoutes);

// Health check & documentation
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || "1.0.0"
  });
});

module.exports = router;