const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");


const Problem = require("../../backend/models/Problem");

const Submission = require("../../backend/models/Submission");


const router = express.Router();

// Temp dir for code files
const tempDir = path.join(__dirname, "..", "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Map languages to Docker executor containers
const containerMap = {
  python: "python_executor",
  cpp: "cpp_executor",
  java: "java_executor",
  javascript: "executor", // Node container itself
};

// ---------------- RUN CODE ----------------
router.post("/run", async (req, res) => {
  try {
    const { code, language, testCases = [] } = req.body;
    const lang = language?.toLowerCase().trim();
    const container = containerMap[lang];

    if (!container) return res.status(400).json({ error: "Unsupported language" });

    const fileId = uuidv4();
    let fileName, compileCmd, runCmd;

    if (lang === "python") {
      fileName = `${fileId}.py`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      runCmd = `docker exec ${container} python /app/temp/${fileName}`;
    } else if (lang === "javascript") {
      fileName = `${fileId}.js`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      runCmd = `docker exec ${container} node /app/temp/${fileName}`;
    } else if (lang === "cpp") {
      fileName = `${fileId}.cpp`;
      const exeFile = `${fileId}.out`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `docker exec ${container} g++ /app/temp/${fileName} -o /app/temp/${exeFile}`;
      runCmd = `docker exec ${container} /app/temp/${exeFile}`;
    } else if (lang === "java") {
      fileName = "Main.java";
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `docker exec ${container} javac /app/temp/${fileName}`;
      runCmd = `docker exec ${container} java -cp /app/temp Main`;
    }

    // Compile if needed
    if (compileCmd) {
      try {
        await new Promise((resolve, reject) => {
          exec(compileCmd, { timeout: 10000 }, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve();
          });
        });
      } catch (err) {
        return res.status(400).json({ error: "Compilation error", details: err });
      }
    }

    // Run test cases
    const results = [];
    for (const tc of testCases) {
      try {
        const output = await new Promise((resolve, reject) => {
          const child = spawn("docker", ["exec", container, "bash", "-c", `${runCmd}`]);
          let out = "";
          let errOut = "";

          child.stdout.on("data", (data) => { out += data.toString(); });
          child.stderr.on("data", (data) => { errOut += data.toString(); });

          child.stdin.write(tc.input);
          child.stdin.end();

          child.on("close", (code) => {
            if (errOut) return reject(errOut);
            resolve(out.trim());
          });
        });

        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: output,
          status: output === String(tc.expectedOutput).trim() ? "pass" : "fail",
        });
      } catch (err) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: err,
          status: "error",
        });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to run code" });
  }
});

// ---------------- SUBMIT CODE ----------------
router.post("/submit",async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language)
      return res.status(400).json({ error: "Missing required fields" });

    const problem = await Problem.findById(problemId).lean();
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const lang = language.toLowerCase().trim();
    const container = containerMap[lang];
    if (!container) return res.status(400).json({ error: "Unsupported language" });

    const fileId = uuidv4();
    let fileName, compileCmd, runCmd;

    if (lang === "python") {
      fileName = `${fileId}.py`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      runCmd = `python /app/temp/${fileName}`;
    } else if (lang === "javascript") {
      fileName = `${fileId}.js`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      runCmd = `node /app/temp/${fileName}`;
    } else if (lang === "cpp") {
      fileName = `${fileId}.cpp`;
      const exeFile = `${fileId}.out`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `g++ /app/temp/${fileName} -o /app/temp/${exeFile}`;
      runCmd = `/app/temp/${exeFile}`;
    } else if (lang === "java") {
      fileName = "Main.java";
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `javac /app/temp/${fileName}`;
      runCmd = `java -cp /app/temp Main`;
    }

    // Compile if needed
    if (compileCmd) {
      try {
        await new Promise((resolve, reject) => {
          exec(`docker exec ${container} bash -c "${compileCmd}"`, { timeout: 10000 }, (err, stdout, stderr) => {
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
          const child = spawn("docker", ["exec", container, "bash", "-c", runCmd]);
          let out = "";
          let errOut = "";

          child.stdout.on("data", (data) => { out += data.toString(); });
          child.stderr.on("data", (data) => { errOut += data.toString(); });

          child.stdin.write(tc.input);
          child.stdin.end();

          child.on("close", () => {
            if (errOut) return reject(errOut);
            resolve(out.trim());
          });
        });

        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: output,
          status: output === String(tc.expectedOutput).trim() ? "pass" : "fail",
        });
      } catch (err) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: err,
          status: "error",
        });
      }
    }

    const passedCount = results.filter(r => r.status === "pass").length;
    const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;
    const success = passedCount === testCases.length;

    // Handle quizType
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
        submittedAt: new Date(),
      });
    }

    res.json({ message: "Submission processed successfully", score, success, results });

  } catch (err) {
    console.error("❌ Error submitting code:", err);
    res.status(500).json({ error: "Server error while submitting code" });
  }
});

// ---------------- RUN CUSTOM CODE ----------------
router.post("/run-custom",async (req, res) => {
  try {
    const { code, language, customInput = "" } = req.body;
    const lang = language?.toLowerCase().trim();
    const container = containerMap[lang];
    if (!container) return res.status(400).json({ output: "Unsupported language" });

    const fileId = uuidv4();
    let fileName;
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    if (lang === "python") fileName = `${fileId}.py`;
    else if (lang === "javascript") fileName = `${fileId}.js`;
    else if (lang === "cpp") fileName = `${fileId}.cpp`;
    else if (lang === "java") fileName = "Main.java";

    fs.writeFileSync(path.join(tempDir, fileName), code);

    // Compile if needed
    let compileCmd;
    let runCmd;
    if (lang === "cpp") {
      compileCmd = `g++ /app/temp/${fileName} -o /app/temp/${fileId}.out`;
      runCmd = `/app/temp/${fileId}.out`;
    } else if (lang === "java") {
      compileCmd = `javac /app/temp/${fileName}`;
      runCmd = `java -cp /app/temp Main`;
    } else if (lang === "python") runCmd = `python /app/temp/${fileName}`;
    else if (lang === "javascript") runCmd = `node /app/temp/${fileName}`;

    if (compileCmd) {
      await new Promise((resolve, reject) => {
        exec(`docker exec ${container} bash -c "${compileCmd}"`, (err, stdout, stderr) => {
          if (err) return reject(stderr || err.message);
          resolve();
        });
      });
    }

    const child = spawn("docker", ["exec", container, "bash", "-c", runCmd]);
    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => { output += data.toString(); });
    child.stderr.on("data", (data) => { errorOutput += data.toString(); });

    child.stdin.write(customInput);
    child.stdin.end();

    child.on("close", () => {
      if (errorOutput) return res.status(400).json({ output: errorOutput.trim() });
      res.json({ output: output.trim() });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ output: "Server error while running code" });
  }
});

module.exports = router;
