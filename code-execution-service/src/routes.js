const express = require("express");


const router = express.Router();


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
module.exports = router;
