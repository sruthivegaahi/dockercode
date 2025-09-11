const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'fill_blank'], required: true },
  answer: mongoose.Schema.Types.Mixed, // number for mcq, string for fill_blank
});

const quizAnswerSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [answerSchema],
  score: { type: Number, required: true },
  terminated: { type: Boolean, default: false },

  // new fields
  startTime: { type: Date, required: true },   
  endTime: { type: Date, required: true },     
  duration: { type: Number, required: true },  
}, { timestamps: true });

module.exports = mongoose.model('QuizAnswer', quizAnswerSchema);
