const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const reservationRoutes = require("./routes/reservationRoutes.js");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use("/api", reservationRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "TicketBoss API is healthy" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Resource not found" });
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  const statusCode = err.status || 500;
  const errorMessage =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "An unexpected error occurred. Please try again later."
      : err.message || "An unknown error occurred";
  res.status(statusCode).json({
    message: errorMessage,
    ...(process.env.NODE_ENV === "development" && { error: err }),
  });
});

module.exports = app;