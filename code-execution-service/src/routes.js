const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { runDocker, tempDir } = require("./executor");

const router = express.Router();

// /run endpoint
router.post("/run", async (req, res) => {
  try {
    const { code, language, testCases = [] } = req.body;

    const fileId = uuidv4();
    const ext = { python: "py", javascript: "js", cpp: "cpp", java: "java" }[language];
    if (!ext) return res.status(400).json({ error: "Unsupported language" });

    const fileName = language === "java" ? "Main.java" : `${fileId}.${ext}`;
    fs.writeFileSync(path.join(tempDir, fileName), code);

    const results = [];
    for (const tc of testCases) {
      try {
        const output = await runDocker(language, fileName, tc.input);
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
    res.status(500).json({ error: "Executor error" });
  }
});

// /run-custom endpoint
router.post("/run-custom", async (req, res) => {
  try {
    const { code, language, customInput = "" } = req.body;

    const fileId = uuidv4();
    const ext = { python: "py", javascript: "js", cpp: "cpp", java: "java" }[language];
    if (!ext) return res.status(400).json({ output: "Unsupported language" });

    const fileName = language === "java" ? "Main.java" : `${fileId}.${ext}`;
    fs.writeFileSync(path.join(tempDir, fileName), code);

    const output = await runDocker(language, fileName, customInput);
    res.json({ output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ output: "Executor error" });
  }
});

module.exports = router;
