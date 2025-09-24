const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'fill_blank','coding'], required: true },
  options: [String], // Required for MCQ
  correctAnswer: mongoose.Schema.Types.Mixed,
    codingProblem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" }, // string for fill_blank, number for mcq
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Java', 'Python'], required: true },
  subcategory: { type: String, enum: ['Basic', 'Medium', 'Advanced'], required: true },
  questions: [questionSchema],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 assignedTargets: [
  {
    collegeName: String,
    branches: [String], // allow multiple branches
  },
],

quizType: { 
      type: String, 
      enum: ['Grand Test', 'Assignment', 'Practice Test'], 
      required: true 
    },
    startTime: { type: Date }, // ⏰ allowed start
  endTime: { type: Date },  
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
