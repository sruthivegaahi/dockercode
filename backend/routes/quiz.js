
const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAnswer = require('../models/QuizAnswer');
const { authenticateToken, authorizeRoles } = require('../middleware/middleware');
const User = require('../models/User');
const Submission=require('../models/Submission');
const Problem=require('../models/Problem')

router.get('/distinct', async (req, res) => {
  try {
    console.log("GET /distinct hit");
    const users = await User.find({
      collegeName: { $ne: null },
      branch: { $ne: null }
    });

    const collegeMap = {};

    users.forEach(user => {
      const college = user.collegeName;
      const branch = user.branch;

      if (!collegeMap[college]) {
        collegeMap[college] = new Set();
      }
      collegeMap[college].add(branch);
    });

    const result = Object.keys(collegeMap).map(college => ({
      name: college,
      branches: Array.from(collegeMap[college])
    }));

    res.json({ colleges: result });

  } catch (err) {
    console.error("Error fetching distinct values:", err);
    res.status(500).json({ message: "Server error while fetching distinct values" });
  }
});
router.post('/assign', authenticateToken, async (req, res) => {
  const { quizId, collegeName, branch } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }


  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check if provided quizType matches the quiz's type
   
    const alreadyAssigned = quiz.assignedTargets.some(
      (target) => target.collegeName === collegeName && target.branch === branch
    );

    if (!alreadyAssigned) {
      quiz.assignedTargets.push({ collegeName, branch });
      await quiz.save();
    }

    res.json({ message: 'Quiz assigned successfully', assignedTargets: quiz.assignedTargets });
  } catch (err) {
    console.error('Error assigning quiz:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: err.message });
  }
});

router.get('/admin', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  try {
    const quizzes = await Quiz.find();

    const quizzesWithCounts = await Promise.all(
      quizzes.map(async (quiz) => {
        const count = await QuizAnswer.countDocuments({ quiz: quiz._id });
        return { ...quiz.toObject(), submissionsCount: count };
      })
    );

    res.json(quizzesWithCounts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: err.message });
  }
});
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const { 
      title, 
      description, 
      category, 
      subcategory, 
      quizType, 
      questions, 
      startTime, 
      endTime 
    } = req.body;

    // ✅ Allowed values
    const allowedCategories = ["Java", "Python"];
    const allowedSubcategories = ["Basic", "Medium", "Advanced"];
    const allowedQuizTypes = ["Grand Test", "Assignment", "Practice Test"];

    // ✅ Basic validation
    if (!title || !description || !category || !subcategory || !quizType || !Array.isArray(questions)) {
      return res.status(400).json({
        message: 'All fields are required including category, subcategory, quizType, and questions.'
      });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: `Invalid category. Allowed values are: ${allowedCategories.join(", ")}`
      });
    }

    if (!allowedSubcategories.includes(subcategory)) {
      return res.status(400).json({
        message: `Invalid subcategory. Allowed values are: ${allowedSubcategories.join(", ")}`
      });
    }

    if (!allowedQuizTypes.includes(quizType)) {
      return res.status(400).json({
        message: `Invalid quizType. Allowed values are: ${allowedQuizTypes.join(", ")}`
      });
    }

    // ✅ Time validation only for Grand Test and Assignment
    if (["Grand Test", "Assignment"].includes(quizType)) {
      if (!startTime || !endTime) {
        return res.status(400).json({
          message: `${quizType} must have both startTime and endTime`
        });
      }
      if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({
          message: "startTime must be before endTime"
        });
      }
    }

    // ✅ Format questions
    const formattedQuestions = questions.map((q) => {
      if (q.type === 'mcq') {
        if (!q.questionText || !Array.isArray(q.options) || q.correctAnswer === undefined) {
          throw new Error('Missing fields in MCQ question');
        }
        if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          throw new Error('Correct answer index out of range');
        }

        return { 
          questionText: q.questionText, 
          type: 'mcq', 
          options: q.options, 
          correctAnswer: q.correctAnswer 
        };
      } 
      else if (q.type === 'fill_blank') {
        if (!q.questionText || !q.correctAnswer) {
          throw new Error('Missing fields in fill_blank question');
        }
        return { 
          questionText: q.questionText, 
          type: 'fill_blank', 
          correctAnswer: q.correctAnswer 
        };
      } 
      else if (q.type === 'coding') {
        if (!q.questionText) {
          throw new Error('Missing fields in coding question');
        }
        return { 
          questionText: q.questionText, 
          type: 'coding', 
          correctAnswer: q.correctAnswer || "", 
          starterCode: q.starterCode || "" 
        };
      } 
      else {
        throw new Error('Invalid question type');
      }
    });

    // ✅ Create quiz
    const quiz = new Quiz({
      title,
      description,
      category,      // Java/Python
      subcategory,   // Basic/Medium/Advanced
      quizType,      // Grand Test/Assignment/Practice Test
      questions: formattedQuestions,
      creator: req.user.userId,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
    });

    await quiz.save();

    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (err) {
    console.error('Error creating quiz:', err.message);
    res.status(500).json({ message: 'Failed to create quiz', error: err.message });
  }
});




router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const { title, questions, category, subcategory } = req.body;

    if (title !== undefined) quiz.title = title;
    if (category !== undefined) quiz.category = category;
    if (subcategory !== undefined) quiz.subcategory = subcategory;

    if (questions !== undefined) {
      if (!Array.isArray(questions)) {
        return res.status(400).json({ message: 'Questions must be an array' });
      }

      for (const q of questions) {
        if (typeof q.questionText !== 'string' || typeof q.type !== 'string') {
          return res.status(400).json({ message: 'Invalid question format' });
        }
        if (q.type === 'mcq') {
          if (!Array.isArray(q.options) || typeof q.correctAnswer !== 'number') {
            return res.status(400).json({ message: 'Invalid MCQ format' });
          }
        } else if (q.type === 'fill_blank') {
          if (typeof q.correctAnswer !== 'string') {
            return res.status(400).json({ message: 'Invalid Fill-in-the-Blank format' });
          }
        } else {
          return res.status(400).json({ message: 'Unsupported question type' });
        }
      }

      quiz.questions = questions;
    }

    await quiz.save();
    res.json({ message: 'Quiz updated', quiz });

  } catch (err) {
    res.status(500).json({ message: 'Failed to update quiz', error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete quiz', error: err.message });
  }
});

router.post('/:id/questions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { questionText, type, options, correctAnswer } = req.body;

  if (typeof questionText !== 'string' || typeof type !== 'string') {
    return res.status(400).json({ message: 'Invalid question format' });
  }

  if (type === 'mcq') {
    if (!Array.isArray(options) || typeof correctAnswer !== 'number') {
      return res.status(400).json({ message: 'Invalid MCQ format' });
    }
  } else if (type === 'fill_blank') {
    if (typeof correctAnswer !== 'string') {
      return res.status(400).json({ message: 'Invalid Fill-in-the-Blank format' });
    }
  } else {
    return res.status(400).json({ message: 'Unsupported question type' });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.questions.push({ questionText, type, options, correctAnswer });
    await quiz.save();
    res.json({ message: 'Question added', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add question', error: err.message });
  }
});

router.delete('/:id/questions/:index', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const index = parseInt(req.params.index);
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (index < 0 || index >= quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    quiz.questions.splice(index, 1);
    await quiz.save();
    res.json({ message: 'Question deleted', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete question', error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get quiz', error: err.message });
  }
});

router.get('/:id/answers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view quiz results' });
    }

    const results = await QuizAnswer.find({ quiz: req.params.id })
      .populate('user', 'name email')
      .populate('quiz', 'title')
        .select('user score startTime endTime duration terminated');

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/test-populate', async (req, res) => {
  try {
    const oneAnswer = await QuizAnswer.findOne().populate('user', 'name email');
    res.json(oneAnswer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function handleQuizSubmission(req, res, restrict = false) {
  const quizId = req.params.id;
  const userId = req.user.userId;

  try {
    if (restrict) {
      const lastAttempt = await QuizAnswer.findOne({ quiz: quizId, user: userId }).sort({ createdAt: -1 });
      if (lastAttempt) {
        const hoursSinceLastAttempt = (Date.now() - new Date(lastAttempt.createdAt)) / (1000 * 60 * 60);
        if (hoursSinceLastAttempt < 24) {
          return res.status(403).json({
            message: `You can attempt this quiz again after ${Math.ceil(24 - hoursSinceLastAttempt)} hours.`,
          });
        }
      }
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { answers } = req.body;
    let score = 0;

    quiz.questions.forEach((q, i) => {
      const submittedAnswer = answers[i];
      const correctAnswer = q.correctAnswer;

      if (q.type === 'mcq' && submittedAnswer === correctAnswer) {
        score++;
      } else if (q.type === 'fill_blank' && typeof submittedAnswer === 'string') {
        if (submittedAnswer.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()) {
          score++;
        }
      }
    });

    const newAnswer = new QuizAnswer({
      quiz: quizId,
      user: userId,
      answers,
      score,
      terminated: false,
    });

    await newAnswer.save();
    res.status(201).json({ message: 'Quiz submitted successfully', score });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ message: 'Failed to submit quiz', error: error.message });
  }
}

router.post('/:id/answer', authenticateToken, async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user.userId;
    const { answers, terminated = false, startTime } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const now = new Date();

    // ⏳ Check if quiz has a time window (Grand Test / Assignment)
    if (["Grand Test", "Assignment"].includes(quiz.quizType)) {
      const start = quiz.startTime ? new Date(quiz.startTime) : null;
      const end = quiz.endTime ? new Date(quiz.endTime) : null;

      if (start && now < start) {
        return res.status(403).json({ message: `⏳ Quiz has not started yet. Starts at ${start.toLocaleString()}` });
      }
      if (end && now > end) {
        return res.status(403).json({ message: `🚫 Quiz time is over. Ended at ${end.toLocaleString()}` });
      }

      // 🔒 24-hour restriction
      const lastAttempt = await QuizAnswer.findOne({ quiz: quizId, user: userId }).sort({ createdAt: -1 });
      if (lastAttempt) {
        const diffMs = now - new Date(lastAttempt.createdAt);
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 24) {
          return res.status(400).json({ 
            message: `You can only attempt this quiz once every 24 hours. Try again in ${Math.ceil(24 - diffHours)} hours.` 
          });
        }
      }
    }

    // ✅ Validate answers
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid answer format.' });
    }

    // ✅ Calculate score
    let score = 0;
    answers.forEach((userAnswer, index) => {
      const question = quiz.questions[index];
      if (!question || userAnswer.answer === undefined) return;

      if (question.type === "mcq") {
        if (parseInt(userAnswer.answer) === parseInt(question.correctAnswer)) score++;
      } else if (question.type === "fill_blank") {
        const correct = String(question.correctAnswer || '').trim().toLowerCase();
        const submitted = String(userAnswer.answer || '').trim().toLowerCase();
        if (correct === submitted) score++;
      }
    });

    // ✅ Record submission timing
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date();
    const duration = Math.floor((end - start) / 1000); // seconds

    const submission = new QuizAnswer({
      quiz: quizId,
      user: userId,
      answers,
      score,
      terminated,
      startTime: start,
      endTime: end,
      duration
    });

    await submission.save();

    res.status(200).json({ 
      message: 'Quiz submitted successfully', 
      score, 
      startTime: start, 
      endTime: end, 
      duration 
    });

  } catch (err) {
    console.error('Error in /quizzes/:id/answer:', err);
    res.status(500).json({ message: 'Server error during quiz submission', error: err.message });
  }
});



router.get('/quiz/:id/last-submission', authenticateToken, async (req, res) => {
  const quizId = req.params.id;
  const userId = req.user.userId;

  try {
    const lastSubmission = await QuizAnswer.findOne({ quiz: quizId, user: userId }).sort({ createdAt: -1 });
    if (!lastSubmission) {
      return res.status(404).json({ message: 'No submission found' });
    }
    res.json(lastSubmission);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch last submission' });
  }
});

router.get('/:id/check-attempt', authenticateToken, async (req, res) => {
  const quizId = req.params.id;
  const userId = req.user.userId;

  try {
    const lastAttempt = await QuizAnswer.findOne({ quiz: quizId, user: userId }).sort({ createdAt: -1 });

    if (!lastAttempt || !lastAttempt.createdAt) {
      return res.json({ attempted: false });
    }

    const createdAt = new Date(lastAttempt.createdAt);
    const hoursSinceLastAttempt = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastAttempt < 24) {
      return res.json({
        attempted: true,
        message: `You can retake this quiz after ${Math.ceil(24 - hoursSinceLastAttempt)} hours.`,
      });
    } else {
      return res.json({ attempted: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking attempt status' });
  }
});
// PUT /api/quizzes/:id/assign

router.get(
  '/student/coding',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const student = await User.findById(req.user.userId);
      if (!student || student.role !== 'student') {
        return res.status(403).json({ message: 'Access denied. Not a student.' });
      }

      const college = student.collegeName?.trim();
      const branch = student.branch?.trim();

      if (!college || !branch) {
        return res.status(400).json({ message: 'Incomplete student profile.' });
      }

      // Fetch quizzes assigned to the student
      const quizzes = await Quiz.find({
        assignedTargets: {
          $elemMatch: {
            collegeName: { $regex: college, $options: 'i' },
            branch: { $regex: branch, $options: 'i' },
          },
        },
      });

      // Filter only quizzes that have coding questions
      const codingQuizzes = quizzes
        .map((q) => {
          const codingQuestions = q.questions.filter((ques) => ques.type === 'coding');
          if (codingQuestions.length > 0) {
            return { 
              _id: q._id,
              title: q.title,
              description: q.description,
              questions: codingQuestions 
            };
          }
          return null;
        })
        .filter(Boolean);

      res.status(200).json(codingQuizzes);
    } catch (err) {
      console.error('Error fetching coding quizzes:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);



router.get(
  "/student/assigned",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const student = await User.findById(req.user.userId);
      if (!student || student.role !== "student") {
        return res.status(403).json({ message: "Access denied. Not a student." });
      }

      const normalizedCollege = student.collegeName?.trim();
      const normalizedBranch = student.branch?.trim();

      if (!normalizedCollege || !normalizedBranch) {
        return res.status(400).json({ message: "Incomplete student profile." });
      }

      const quizzes = await Quiz.find({
        assignedTargets: {
          $elemMatch: {
            collegeName: { $regex: normalizedCollege, $options: "i" },
            branch: { $regex: normalizedBranch, $options: "i" },
          },
        },
      }).lean();

      const now = new Date();
      const quizAttempts = await QuizAnswer.find({ user: student._id }).lean();
      const attemptedQuizIds = new Set(quizAttempts.map(a => a.quiz.toString()));

      const quizzesWithStatus = quizzes.map((quiz) => {
        let canAttempt = true;
        let status = "available";

        if (attemptedQuizIds.has(quiz._id.toString())) {
          canAttempt = false;
          status = "alreadyAttempted";
        }

        if ((quiz.quizType === "Grand Test" || quiz.quizType === "Assignment") && quiz.endTime) {
          if (now > new Date(quiz.endTime)) {
            canAttempt = false;
            status = "expired";
          }
        }

        return {
          ...quiz,
          attempted: attemptedQuizIds.has(quiz._id.toString()),
          canAttempt,
          status,
        };
      });

      return res.status(200).json(quizzesWithStatus);
    } catch (err) {
      console.error("❌ Error fetching assigned quizzes:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);


router.get('/:quizId/review', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.userId;

    const studentAnswer = await QuizAnswer.findOne({ quiz: quizId, user: userId });
    if (!studentAnswer) return res.status(404).json({ message: 'No submission found' });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const reviewData = quiz.questions.map((q, idx) => {
      const studentAns = studentAnswer.answers[idx]?.answer;
      const correct = q.correctAnswer;
      const isCorrect =
        q.type === 'mcq'
          ? parseInt(studentAns) === parseInt(correct)
          : String(studentAns || '').trim().toLowerCase() === String(correct).trim().toLowerCase();

      return {
        question: q.questionText,
        type: q.type,
        options: q.options || [],
        studentAnswer: studentAns,
        correctAnswer: correct,
        isCorrect
      };
    });

    res.json({ quizTitle: quiz.title, review: reviewData, score: studentAnswer.score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get review', error: err.message });
  }
});

// GET /api/tracking/student
// GET /api/quizzes/student/tracking
router.get(
  '/student/tracking',
  authenticateToken,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const studentId = req.user.userId;

      // 1️⃣ Fetch normal quiz attempts
      const normalAttempts = await QuizAnswer.find({ user: studentId })
        .populate('quiz', 'title questions quizType') // 🔥 also fetch quizType
        .lean();

      const normalTracking = normalAttempts.map((sub) => {
        const totalQuestions =
          sub.quiz?.questions?.length || sub.answers?.length || 0;
        const correctAnswers = sub.score ?? 0;

        return {
          type: 'normal',
          quizTitle: sub.quiz?.title || 'Untitled Quiz',
          score: correctAnswers,
          total: totalQuestions,
          date: sub.createdAt,
          quizType: sub.quiz?.quizType || 'Grand Test', // 🔥 add quizType
        };
      });

      // 2️⃣ Fetch coding quiz submissions
      const codingSubmissions = await Submission.find({ student: studentId })
        .populate('problem', 'title testCases quizType') // 🔥 also fetch quizType
        .lean();

      const codingTracking = codingSubmissions.map((sub) => {
        const totalTestCases = sub.problem?.testCases?.length || 0;

        return {
          type: 'coding',
          problemTitle: sub.problem?.title || 'Untitled Problem',
          score: sub.score ?? 0,
          total: totalTestCases,
          date: sub.submittedAt,
          quizType: sub.problem?.quizType || 'Practice Test', // 🔥 add quizType
        };
      });

      // 3️⃣ Merge both tracking arrays and sort by most recent
      const tracking = [...normalTracking, ...codingTracking].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      res.json(tracking);

    } catch (err) {
      console.error('❌ Error fetching student tracking:', err);
      res.status(500).json({ message: 'Server error fetching student tracking' });
    }
  }
);

// GET /api/quizzes/student/tracking-summary
// routes/quizRoutes.js (or wherever your route is defined)
router.get(
  "/student/tracking-summary",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const studentId = req.user.userId;

      const student = await User.findById(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });

      const normalizedCollege = student.collegeName?.trim();
      const normalizedBranch = student.branch?.trim();

      if (!normalizedCollege || !normalizedBranch) {
        return res.status(400).json({ message: "Incomplete student profile." });
      }

      // 1️⃣ Fetch assigned NORMAL quizzes
      const assignedQuizzes = await Quiz.find({
        assignedTargets: {
          $elemMatch: {
            collegeName: { $regex: normalizedCollege, $options: "i" },
            branch: { $regex: normalizedBranch, $options: "i" },
          },
        },
      }).lean();

      // 2️⃣ Fetch assigned CODING problems
      const assignedProblems = await Problem.find({
        assignedTargets: {
          $elemMatch: {
            collegeName: { $regex: normalizedCollege, $options: "i" },
            branch: { $regex: normalizedBranch, $options: "i" },
          },
        },
      }).lean();

      // 3️⃣ Fetch attempts
      const quizAttempts = await QuizAnswer.find({ user: studentId }).lean();
      const codingAttempts = await Submission.find({ user: studentId }).lean();

      const attemptedQuizIds = new Set(quizAttempts.map((a) => a.quiz.toString()));
      const attemptedProblemIds = new Set(codingAttempts.map((s) => s.problem.toString()));

      // 4️⃣ Prepare summary
      const summary = {
        "Assignment": { total: 0, attempted: 0, remaining: 0 },
        "Practice Test": { total: 0, attempted: 0, remaining: 0 },
        "Grand Test": { total: 0, attempted: 0, remaining: 0 },
      };

      // Count normal quizzes
      assignedQuizzes.forEach((quiz) => {
        const type = quiz.quizType;
        if (!summary[type]) return;

        summary[type].total += 1;
        if (attemptedQuizIds.has(quiz._id.toString())) {
          summary[type].attempted += 1;
        }
      });

      // Count coding problems
      assignedProblems.forEach((problem) => {
        const type = problem.quizType; // 👈 make sure you store quizType in Problem schema
        if (!summary[type]) return;

        summary[type].total += 1;
        if (attemptedProblemIds.has(problem._id.toString())) {
          summary[type].attempted += 1;
        }
      });

      // 5️⃣ Remaining = total - attempted
      for (let type in summary) {
        summary[type].remaining = summary[type].total - summary[type].attempted;
      }

      res.json(summary);
    } catch (err) {
      console.error("❌ Error fetching quiz summary:", err);
      res.status(500).json({ message: "Server error fetching quiz summary" });
    }
  }
);


module.exports = router;