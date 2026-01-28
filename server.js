require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
// const MongoStore = require('connect-mongo');
const MongoStore = require("connect-mongo").default;

const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const routes = require('./routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// ---------------- SESSION SETUP (FIXED) ---------------- //

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: "gigstm",
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60,
      autoRemove: "native",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// ----------------- MIDDLEWARE ----------------- //
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL],
    credentials: true,
  })
);

// ----------------- ROUTES ----------------- //
// API Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use("/", routes);


// ----------------- ERROR HANDLER ----------------- //
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  const errorResponse = { status: "error" };
  if (err.message) errorResponse.message = err.message;

  res.status(err.statusCode || 500).json(errorResponse);
});

// ----------------- START SERVER ----------------- //
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


