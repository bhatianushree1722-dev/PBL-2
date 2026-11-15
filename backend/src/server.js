
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const readingsRouter = require("./routes/readings");
const simulationRouter = require("./routes/simulation");
const dashboardRouter = require("./routes/dashboard");
const mlRouter = require("./routes/ml");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/readings", readingsRouter);
app.use("/api/simulation", simulationRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ml", mlRouter);

// Basic API route
app.get("/", (req, res) => {
  res.json({
    name: "AquaSense API",
    status: "running",
    message: "Water monitoring backend is ready",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AquaSense API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
