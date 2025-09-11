require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcrypt'); 

const User = require('./models/User'); 

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.0.5:5173',
    'http://124.123.120.85'
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

const multerUpload = multer({ storage: multer.memoryStorage() });

// ===== Helper =====
function capitalizeFirstLetter(str) {
  if (!str) return '';
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// ===== Upload Excel for Users =====
app.post('/api/upload-users-excel', (req, res) => {
  multerUpload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (file too large, etc.)
      return res.status(400).json({ message: "File upload error", error: err.message });
    } else if (err) {
      return res.status(500).json({ message: "Upload failed", error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file received" });
    }

    try {
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);

      const savedEmails = [];
      const skippedUsers = [];

      for (const user of data) {
        if (!user.email || !user.password || !user.name || !user.collegeName || !user.branch || !user.gender) {
          skippedUsers.push(user);
          continue;
        }

        const emailLower = user.email.toLowerCase();
        const branchLower = user.branch.toLowerCase();
        const collegeLower = user.collegeName.toLowerCase();
        const roleLower = user.role && ['student', 'admin'].includes(user.role.toLowerCase())
          ? user.role.toLowerCase()
          : 'student';

        const exists = await User.findOne({ email: emailLower });
        if (!exists) {
          const hashedPassword = await bcrypt.hash(String(user.password), 10);
          const newUser = new User({
            name: user.name,
            email: emailLower,
            password: hashedPassword,
            role: roleLower,
            collegeName: collegeLower,
            branch: branchLower,
            gender: capitalizeFirstLetter(user.gender)
          });
          await newUser.save();
          savedEmails.push(emailLower);
        } else {
          skippedUsers.push(user);
        }
      }

      res.json({
        message: "Upload complete",
        users: savedEmails,
        skipped: skippedUsers.length ? skippedUsers : null
      });
    } catch (error) {
      console.error("Upload error:", error.message);
      res.status(500).json({ message: "Upload failed", error: error.message });
    }
  });
});

// ===== Routes =====
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const quizRoutes = require('./routes/quiz');

const adminRoutes = require('./routes/admin');

const problemRoutes = require("./routes/problemRoutes");


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/problems", problemRoutes);  // <-- /run and /submit now live here


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
