const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { exec ,spawn} = require("child_process");
const fs = require("fs");
const path = require("path");
const User=require("../models/User")
const Problem = require("../models/Problem");
const Quiz = require("../models/Quiz");
const Submission = require("../models/Submission"); // Add at top

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
router.post("/run", authenticateToken, async (req, res) => {
  const { code, language, testCases = [] } = req.body;
  const fileId = uuidv4();
  let fileName, compileCmd, runCmd;

  if (language === "python") {
    fileName = `${fileId}.py`;
    compileCmd = "";
    runCmd = `python3 ${fileName}`;
  } else if (language === "cpp") {
    fileName = `${fileId}.cpp`;
    compileCmd = `g++ ${fileName} -o ${fileId}.out`;
    runCmd = `./${fileId}.out`;
  }  else if (language === "java") {
  fileName = "Main.java"; // always save as Main.java
  compileCmd = `javac ${fileName}`;
  runCmd = `java Main`;


  } else if (language === "javascript") {
    fileName = `${fileId}.js`;
    compileCmd = "";
    runCmd = `node ${fileName}`;
  } else {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, code);

  // Compile if needed
  if (compileCmd) {
    try {
      await new Promise((resolve, reject) => {
        exec(compileCmd, { cwd: tempDir, timeout: 5000 }, (error, stdout, stderr) => {
          if (error) return reject(stderr || error.message);
          resolve();
        });
      });
    } catch (err) {
      return res.json({ error: "Compilation error", details: err });
    }
  }

  // Run test cases
  const results = [];
  for (let tc of testCases) {
    try {
      const output = await new Promise((resolve, reject) => {
        const child = exec(runCmd, { cwd: tempDir, timeout: 5000 }, (error, stdout, stderr) => {
          if (error) return reject(stderr || error.message);
          resolve(stdout.trim());
        });
        if (child.stdin) child.stdin.end(tc.input);
      });

      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: output,
        status: output === String(tc.expectedOutput).trim() ? "pass" : "fail"
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: err,
        status: "error"
      });
    }
  }

  res.json({ results });
});

//
// 📌 SUBMIT CODE (runs against all problem test cases)
//
// 📌 SUBMIT CODE (runs against all problem test cases)
router.post("/submit", authenticateToken, authorizeRoles("student"), async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language)
      return res.status(400).json({ error: "Missing required fields" });

    // Fetch problem
    const problem = await Problem.findById(problemId).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const tempFileId = uuidv4();
    const tempFileDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempFileDir)) fs.mkdirSync(tempFileDir, { recursive: true });

    let fileName, compileCmd, runCmdFunc;
    const lang = language.toLowerCase().trim();

    // Prepare file and run command
    if (lang === "python") {
      fileName = `${tempFileId}.py`;
      fs.writeFileSync(path.join(tempFileDir, fileName), code);
      runCmdFunc = (input) => `echo "${input}" | python3 ${fileName}`;
    } else if (lang === "javascript") {
      fileName = `${tempFileId}.js`;
      fs.writeFileSync(path.join(tempFileDir, fileName), code);
      runCmdFunc = (input) => `echo "${input}" | node ${fileName}`;
    } else if (lang === "cpp") {
      fileName = `${tempFileId}.cpp`;
      const exeFile = `${tempFileId}.out`;
      fs.writeFileSync(path.join(tempFileDir, fileName), code);
      compileCmd = `g++ ${fileName} -o ${exeFile}`;
      runCmdFunc = (input) => `echo "${input}" | ./${exeFile}`;
    } else if (lang === "java") {
      fileName = "Main.java";
      fs.writeFileSync(path.join(tempFileDir, fileName), code);
      compileCmd = `javac ${fileName}`;
      runCmdFunc = (input) => `echo "${input}" | java Main`;
    } else {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // Compile if needed
    if (compileCmd) {
      try {
        await new Promise((resolve, reject) => {
          exec(compileCmd, { cwd: tempFileDir, timeout: 5000 }, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve();
          });
        });
      } catch (err) {
        return res.status(400).json({ error: "Compilation error", details: err });
      }
    }

    // Run all test cases
    const testCases = problem.testCases || [];
    const results = [];

    for (const tc of testCases) {
      try {
        const output = await new Promise((resolve, reject) => {
          exec(runCmdFunc(tc.input), { cwd: tempFileDir, timeout: 5000 }, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve(stdout.trim());
          });
        });

        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: output,
          status: output === String(tc.expectedOutput).trim() ? "pass" : "fail"
        });
      } catch (err) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: err,
          status: "error"
        });
      }
    }

    // Calculate score
    const passedCount = results.filter(r => r.status === "pass").length;
    const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;
    const success = passedCount === testCases.length;

    // 📌 Handle based on quizType
    if (problem.quizType === "Practice Test") {
      // ✅ Overwrite old submission (or create if none)
      await Submission.findOneAndUpdate(
        { student: req.user.userId, problem: problem._id },
        {
          code,
          language,
          results,
          score,
          success,
          submittedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    } else {
      // 🚫 Assignment/Grand Test allow only once
      const existing = await Submission.findOne({ student: req.user.userId, problem: problem._id });
      if (existing) {
        return res.status(400).json({ error: "You have already submitted this problem." });
      }

      const submission = new Submission({
        problem: problem._id,
        student: req.user.userId,
        code,
        language,
        results,
        score,
        success,
        submittedAt: new Date(),
      });

      await submission.save();
    }

    res.json({
      message: "Submission processed successfully",
      score,
      success,
      results
    });

  } catch (err) {
    console.error("❌ Error submitting code:", err);
    res.status(500).json({ error: "Server error while submitting code" });
  }
});


router.post("/run-custom", async (req, res) => {
  try {
    const { code, language, customInput = "" } = req.body;
    const lang = language?.toLowerCase().trim();

    const fileId = uuidv4();
    let fileName, compileCmd;
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    if (lang === "python") {
      fileName = `${fileId}.py`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
    } else if (lang === "javascript") {
      fileName = `${fileId}.js`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
    } else if (lang === "cpp") {
      fileName = `${fileId}.cpp`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `g++ ${fileName} -o ${fileId}.out`;
    } else if (lang === "java") {
      fileName = "Main.java"; // Java requires class name to match file
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `javac ${fileName}`;
    } else {
      return res.status(400).json({ output: "Unsupported language" });
    }

    // Compile if needed (C++ / Java)
    if (compileCmd) {
      await new Promise((resolve, reject) => {
        exec(compileCmd, { cwd: tempDir, timeout: 5000 }, (err, stdout, stderr) => {
          if (err) return reject(stderr || err.message);
          resolve();
        });
      });
    }

    // Determine command to run
    let runArgs;
    let runCommand;

    if (lang === "python") runArgs = ["python3", fileName];
    else if (lang === "javascript") runArgs = ["node", fileName];
    else if (lang === "cpp") runArgs = [path.join(tempDir, `${fileId}.out`)];
    else if (lang === "java") runArgs = ["java", "-cp", tempDir, "Main"];

    runCommand = spawn(runArgs[0], runArgs.slice(1), { cwd: tempDir });

    let output = "";
    let errorOutput = "";

    runCommand.stdout.on("data", (data) => { output += data.toString(); });
    runCommand.stderr.on("data", (data) => { errorOutput += data.toString(); });

    // Send custom input
    runCommand.stdin.write(customInput);
    runCommand.stdin.end();

    runCommand.on("close", (code) => {
      if (errorOutput) return res.status(400).json({ output: errorOutput.trim() });
      res.json({ output: output.trim() });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ output: "Server error while running code" });
  }
});
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

module.exports = router;

