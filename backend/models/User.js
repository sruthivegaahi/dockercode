const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], },
  avatar: { type: String },
  description: { type: String },
  collegeName: { type: String },
  branch: { type: String },        
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  
}, { timestamps: true });



module.exports = mongoose.model('User', UserSchema);
