const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const userRouter = require("./routing/userroute");
const { Router: applicationRouter } = require("./routing/applicationRouting");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors()
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Job Tracker API is running" });
});

app.use("/user", userRouter);
app.use("/application", applicationRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "ValidationError") {
    const details = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");

    return res.status(400).json({ message: details || "Invalid input" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid application id" });
  }

  console.error(error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    app.listen(port, () => {
      console.log(`Server connected successfully on port ${port}`);
      console.log("MongoDB connected successfully");
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
