const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Temp dir for code files
const tempDir = path.join(__dirname, "..", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper to run code inside correct container
function runCode(language, code, input, callback) {
  const fileId = uuidv4();
  let fileName, compileCmd, runCmd, container;

  switch (language) {
    case "python":
      fileName = `${fileId}.py`;
      container = "python_executor";
      runCmd = `python /app/temp/${fileName}`;
      break;

    case "cpp":
      fileName = `${fileId}.cpp`;
      container = "cpp_executor";
      compileCmd = `g++ /app/temp/${fileName} -o /app/temp/${fileId}.out`;
      runCmd = `/app/temp/${fileId}.out`;
      break;

    case "java":
      fileName = `Main.java`;
      container = "java_executor";
      compileCmd = `javac /app/temp/${fileName}`;
      runCmd = `java -cp /app/temp Main`;
      break;

    case "javascript":
    case "js":
      fileName = `${fileId}.js`;
      container = "js_executor";
      runCmd = `node /app/temp/${fileName}`;
      break;

    default:
      return callback("Unsupported language");
  }

  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, code);

  const execute = () => {
    const child = spawn("docker", [
      "exec",
      "-i",
      container,
      "sh",
      "-c",
      runCmd,
    ]);

    let output = "";
    let error = "";

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();

    child.stdout.on("data", (data) => (output += data.toString()));
    child.stderr.on("data", (data) => (error += data.toString()));

    child.on("close", () => callback(null, output.trim(), error.trim()));
  };

  if (compileCmd) {
    exec(`docker exec ${container} sh -c "${compileCmd}"`, (err, stdout, stderr) => {
      if (err || stderr) return callback(stderr || err.message);
      execute();
    });
  } else {
    execute();
  }
}

// Run against predefined test cases
router.post("/run", async (req, res) => {
  try {
    const { code, language, testCases = [] } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    const results = [];
    for (const tc of testCases) {
      await new Promise((resolve) => {
        runCode(language, code, tc.input, (err, stdout, stderr) => {
          if (err || stderr) {
            results.push({
              input: tc.input,
              expected: tc.expectedOutput,
              output: stderr || err,
              status: "error",
            });
          } else {
            results.push({
              input: tc.input,
              expected: tc.expectedOutput,
              output: stdout,
              status: stdout === tc.expectedOutput ? "pass" : "fail",
            });
          }
          resolve();
        });
      });
    }

    res.json({ results });
  } catch (err) {
    console.error("❌ Execution error:", err);
    res.status(500).json({ error: "Execution failed" });
  }
});

// Run with custom input
router.post("/run-custom", async (req, res) => {
  try {
    const { code, language, customInput = "" } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    runCode(language, code, customInput, (err, stdout, stderr) => {
      if (err || stderr) {
        return res.json({ output: stderr || err, success: false });
      }
      res.json({ output: stdout, success: true });
    });
  } catch (err) {
    console.error("❌ Custom run error:", err);
    res.status(500).json({ error: "Custom execution failed" });
  }
});

module.exports = router;
