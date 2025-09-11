// models/Submission.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  results: [
    {
      input: String,
      expected: String,
      actual: String,
      status: String
    }
  ],
  score: { type: Number, required: true },
  success: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now },
   attemptNumber: { type: Number, default: 1 }, // how many attempts so far
  lastAttemptAt: { type: Date, default: Date.now } // last submission time
});

module.exports = mongoose.model("Submission", submissionSchema);
