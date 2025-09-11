require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

 

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.0.5:5173',
    'http://124.123.120.85',
    'http://168.231.103.24',
    'https://exam.vegaahi.com'

  ],
  credentials: true
}));

// ===== DB Connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ===== Temp directory for code execution =====
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("Created temp directory:", tempDir);
}

// ===== Upload directories =====
app.use('/uploads', express.static('uploads'));
const uploadDirs = [
  path.join(__dirname, 'uploads/thumbnails'),
  path.join(__dirname, 'uploads/videos'),
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});


// ===== Helper =====

// ===== Upload Excel for Users =====

// ===== Routes =====
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const quizRoutes = require('./routes/quiz');

const adminRoutes = require('./routes/admin');
const excel=require('./routes/excel')
const problemRoutes = require("./routes/problemRoutes");


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/problems", problemRoutes);  // <-- /run and /submit now live here
app.use("/api/excel",excel);

// ===== Error handler =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

// ===== Serve frontend =====
app.use(express.static(path.resolve(__dirname, '../frontend/dist')));
app.get('/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
});

// ===== Start server =====
const PORT = 8100;
const HOST = '0.0.0.0';  
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});