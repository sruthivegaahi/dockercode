const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false } // hidden test cases not shown to students
});

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
  testCases: [testCaseSchema],
    assignedTargets: [
  {
    collegeName: String,
    branch: String, // allow multiple branches
  },
],

    // 🔥 New field to support same quiz types as Quiz
quizType: { 
      type: String, 
      enum: ['Grand Test', 'Assignment', 'Practice Test'], 
      required: true 
    },
    startTime: { type: Date }, 
endTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);
