const xlsx = require('xlsx');
const bcrypt = require('bcrypt'); 
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const multerUpload = multer({ storage: multer.memoryStorage() });
router.post('/upload-users-excel', multerUpload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const savedEmails = [];

    for (const user of data) {
      if (!user.email || !user.password || !user.name || !user.collegeName || !user.branch || !user.gender) continue;

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
      }
    }

    res.json({ message: "Upload successful", users: savedEmails });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});
function capitalizeFirstLetter(str) {
  if (!str) return '';
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
module.exports = router;