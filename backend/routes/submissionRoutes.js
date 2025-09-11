const express = require("express");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { executeCode } = require("../utils/codeExecutor"); // docker-based executor

const router = express.Router();

// 📌 Submit Solution
router.post("/", async (req, res) => {
  try {
    const { userId, problemId, code, language } = req.body;
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    let allPassed = true;
    let lastOutput = "";

    for (const tc of problem.testCases) {
      const result = await executeCode(language, code, tc.input);
      lastOutput = result.output;

      if (result.error || result.output.trim() !== tc.expectedOutput.trim()) {
        allPassed = false;
        break;
      }
    }

    const submission = new Submission({
      userId,
      problemId,
      code,
      language,
      status: allPassed ? "Passed" : "Failed",
      output: lastOutput
    });

    await submission.save();
    res.json(submission);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get Submissions of a User
router.get("/user/:userId", async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.params.userId })
      .populate("problemId", "title")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
