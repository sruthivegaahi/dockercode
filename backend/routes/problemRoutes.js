const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { exec ,spawn} = require("child_process");
const fs = require("fs");
const path = require("path");
const User=require("../models/User")
const Problem = require("../models/Problem");
const Quiz = require("../models/Quiz");
const Submission = require("../models/Submission"); // Add at top
const axios = require("axios");

const { authenticateToken, authorizeRoles } = require("../middleware/middleware");

const router = express.Router();

// Temp dir for code files
const tempDir = path.join(__dirname, "..", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

//
// 📌 PROBLEM ROUTES
//

// Create Problem
router.post("/", async (req, res) => {
  try {
    const { title, description, difficulty, testCases, quizType, startTime, endTime } = req.body;

    // Validate required fields
    if (!title || !description || !quizType) {
      return res.status(400).json({ message: "Title, description, and quizType are required." });
    }

    // Validate quizType
    const validQuizTypes = ["Grand Test", "Assignment", "Practice Test"];
    if (!validQuizTypes.includes(quizType)) {
      return res.status(400).json({ message: "Invalid quiz type." });
    }

    // Optional: Validate start/end times only for Grand Test or Assignment
    let start = startTime ? new Date(startTime) : undefined;
    let end = endTime ? new Date(endTime) : undefined;
    if ((quizType === "Grand Test" || quizType === "Assignment") && (!start || !end)) {
      return res.status(400).json({ message: "Start and end time required for Grand Test or Assignment." });
    }

    // Create Problem
    const problem = new Problem({
      title,
      description,
      difficulty,
      testCases,
      quizType,
      startTime: start,
      endTime: end,
    });

    await problem.save();

    res.status(201).json({ message: "Problem created successfully", problem });
  } catch (err) {
    console.error("❌ Error creating problem:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// Get All Problems
router.get("/", async (req, res) => {
  try {
    const problems = await Problem.find().select("-__v");
    res.json(problems);
  } catch (err) {
    console.error("❌ Error fetching problems:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get Single Problem by ID (hide hidden testcases)
router.get("/:id", async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    if (problem.testCases) {
      problem.testCases = problem.testCases.filter((tc) => !tc.isHidden);
    }

    res.json(problem);
  } catch (err) {
    console.error("❌ Error fetching problem:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update Problem
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const problem = await Problem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!problem) return res.status(404).json({ error: "Problem not found" });

    res.json({ message: "Problem updated successfully", problem });
  } catch (err) {
    console.error("❌ Error updating problem:", err);
    res.status(500).json({ error: err.message });
  }
});

// Assign Problem to College/Branch
router.post("/assign", async (req, res) => {
  try {
    let { id, quizId, collegeName, branch } = req.body;
    const targetId = id || quizId; // accept either key

    // Validate required fields
    if (!targetId || !collegeName || !branch) {
      return res.status(400).json({ error: "Missing required fields, quizType is required" });
    }

    // Trim and normalize inputs safely
    collegeName = collegeName ? collegeName.trim() : "";
    branch = branch ? branch.trim() : "";
   

    if (!collegeName || !branch) {
      return res.status(400).json({ error: "College, branch, and quizType cannot be empty" });
    }

    const problem = await Problem.findById(targetId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }


    if (!problem.assignedTargets) problem.assignedTargets = [];

    // Prevent duplicate assignment (case-insensitive)
    const alreadyAssigned = problem.assignedTargets.some(
      ({ collegeName: c, branch: b }) => 
        (c || "").trim().toLowerCase() === collegeName.toLowerCase() &&
        (b || "").trim().toLowerCase() === branch.toLowerCase()
    );

    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ error: "Problem already assigned to this college and branch" });
    }

    // Assign the problem
    problem.assignedTargets.push({ collegeName, branch });
    await problem.save();

    res.json({ message: "Problem assigned successfully", assignedTargets: problem.assignedTargets });
  } catch (err) {
    console.error("❌ Error assigning problem:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get All Coding Quizzes
router.get("/quizzes/coding", authenticateToken, async (req, res) => {
  try {
    const codingQuizzes = await Quiz.find({ "questions.type": "coding" })
      .populate("questions.codingProblem")
      .populate("creator", "name email");
    res.json(codingQuizzes);
  } catch (err) {
    console.error("❌ Error fetching coding quizzes:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get Single Coding Quiz by ID
router.get("/quizzes/coding/:id", authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("questions.codingProblem")
      .populate("creator", "name email");

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    res.json(quiz);
  } catch (err) {
    console.error("❌ Error fetching coding quiz:", err);
    res.status(500).json({ error: err.message });
  }
});

//
// 📌 STUDENT ROUTES - get all coding problems directly
//

//
// 📌 RUN CODE (with custom test cases)
//

router.get(
  "/student/coding",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { collegeName, branch, role } = req.user;

      if (role !== "student") {
        return res.status(403).json({ message: "Access denied. Not a student." });
      }
      if (!collegeName || !branch) {
        return res.status(400).json({ message: "Incomplete student profile." });
      }

      const college = collegeName.trim();
      const br = branch.trim();

      const problems = await Problem.find({
        assignedTargets: {
          $elemMatch: {
            collegeName: { $regex: `^${college}$`, $options: "i" },
            branch: { $regex: `^${br}$`, $options: "i" },
          },
        },
      }).lean();

      res.json(problems || []);
    } catch (err) {
      console.error("❌ Error fetching assigned coding problems:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/student/coding-with-status",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { collegeName, branch, role } = req.user;

      if (role !== "student") {
        return res.status(403).json({ message: "Access denied. Not a student." });
      }
      if (!collegeName || !branch) {
        return res.status(400).json({ message: "Incomplete student profile." });
      }

      const college = collegeName.trim();
      const br = branch.trim();

      // 1️⃣ Get all problems assigned to this student
      const problems = await Problem.find({
        assignedTargets: {
          $elemMatch: {
            collegeName: { $regex: `^${college}$`, $options: "i" },
            branch: { $regex: `^${br}$`, $options: "i" },
          },
        },
      }).lean();

      const now = new Date();

      // 2️⃣ For each problem, check student's last submission, cooldown, and availability
      const problemsWithStatus = await Promise.all(
        problems.map(async (p) => {
          const lastSubmission = await Submission.findOne({
            problem: p._id,
            student: req.user.userId,
          })
            .sort({ submittedAt: -1 })
            .lean();

          let canAttempt = true;
          let cooldownHours = 0;
          let availabilityMessage = "";

          // Practice Test: always allow, overwrite old submission
          if (p.quizType === "Practice Test") {
            canAttempt = true;
          } else {
            // 2a️⃣ Cooldown for Grand Test / Assignment
            if (lastSubmission) {
              const hoursSinceLast =
                (now - new Date(lastSubmission.submittedAt)) / (1000 * 60 * 60);
              if (hoursSinceLast < 24) {
                canAttempt = false;
                cooldownHours = Math.ceil(24 - hoursSinceLast);
                availabilityMessage = `Wait ${cooldownHours}h to reattempt`;
              }
            }

            // 2b️⃣ Check start/end time only if still can attempt
            if (canAttempt) {
              let start = p.startTime ? new Date(p.startTime) : null;
              let end = p.endTime ? new Date(p.endTime) : null;

              // Validate dates
              if (start && isNaN(start.getTime())) start = null;
              if (end && isNaN(end.getTime())) end = null;

              if (start && now < start) {
                canAttempt = false;
                availabilityMessage = `Available from ${start.toLocaleString()}`;
              } else if (end && now > end) {
                canAttempt = false;
                availabilityMessage = `Ended at ${end.toLocaleString()}`;
              }
            }
          }

          return {
            ...p,
            lastSubmission,
            canAttempt,
            cooldownHours,
            availabilityMessage,
          };
        })
      );

      res.json(problemsWithStatus);
    } catch (err) {
      console.error("❌ Error fetching coding problems with status:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


router.delete("/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    await Problem.findByIdAndDelete(id);
    res.json({ message: "Problem deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting problem:", err);
    res.status(500).json({ error: err.message });
  }
});
//
// 📌 RUN CODE (with test cases)
//
router.post("/run", authenticateToken, async (req, res) => {
  try {
    const { code, language, testCases = [] } = req.body;

    // Call Code Execution Service
    const response = await axios.post("http://localhost:5000/run", {
      code,
      language,
      testCases
    }, { timeout: 10000 });

    res.json(response.data);
  } catch (err) {
    console.error("❌ Error running code:", err.message);
    res.status(500).json({ error: "Failed to run code" });
  }
});

//
// 📌 RUN CODE WITH CUSTOM INPUT
//
router.post("/run-custom", authenticateToken, async (req, res) => {
  try {
    const { code, language, customInput = "" } = req.body;

    // Call Code Execution Service
    const response = await axios.post("http://localhost:5000/run-custom", {
      code,
      language,
      customInput
    }, { timeout: 10000 });

    res.json(response.data);
  } catch (err) {
    console.error("❌ Error running custom code:", err.message);
    res.status(500).json({ output: "Failed to run code" });
  }
});

//
// 📌 SUBMIT CODE (run against all problem test cases)
//
router.post("/submit", authenticateToken, authorizeRoles("student"), async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language)
      return res.status(400).json({ error: "Missing required fields" });

    // Fetch problem
    const problem = await Problem.findById(problemId).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const testCases = problem.testCases || [];

    // Call Code Execution Service to run all test cases
    const execResponse = await axios.post("http://localhost:5000/run", {
      code,
      language,
      testCases
    }, { timeout: 20000 });

    const results = execResponse.data.results || [];
    const passedCount = results.filter(r => r.status === "pass").length;
    const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;
    const success = passedCount === testCases.length;

    // Handle Practice Test vs Assignment/Grand Test
    if (problem.quizType === "Practice Test") {
      await Submission.findOneAndUpdate(
        { student: req.user.userId, problem: problem._id },
        { code, language, results, score, success, submittedAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      const existing = await Submission.findOne({ student: req.user.userId, problem: problem._id });
      if (existing) return res.status(400).json({ error: "You have already submitted this problem." });

      await Submission.create({
        problem: problem._id,
        student: req.user.userId,
        code,
        language,
        results,
        score,
        success,
        submittedAt: new Date()
      });
    }

    res.json({ message: "Submission processed successfully", score, success, results });

  } catch (err) {
    console.error("❌ Error submitting code:", err);
    res.status(500).json({ error: "Server error while submitting code" });
  }
});

module.exports = router;

