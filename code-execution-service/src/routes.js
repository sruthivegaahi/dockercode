const express = require("express");
const { runCode } = require("./executor");

const router = express.Router();

/**
 * Run code against single input
 */
router.post("/run", async (req, res) => {
  try {
    const { code, language, input = "" } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: "Missing code or language" });
    }

    const result = await runCode({ code, language, input });
    res.status(result.error ? 400 : 200).json(result);
  } catch (err) {
    console.error("Run error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Run code with custom input
 */
router.post("/run-custom", async (req, res) => {
  try {
    const { code, language, customInput = "" } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: "Missing code or language" });
    }

    const result = await runCode({ code, language, input: customInput });
    res.status(result.error ? 400 : 200).json(result);
  } catch (err) {
    console.error("Run-custom error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Submit code against multiple test cases
 */
router.post("/submit", async (req, res) => {
  try {
    const { code, language, testCases = [] } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: "Missing code or language" });
    }

    const results = [];
    for (const tc of testCases) {
      const result = await runCode({ code, language, input: tc.input });

      results.push({
        input: tc.input,
        expected: String(tc.expectedOutput).trim(),
        actual: result.output ? result.output.trim() : "",
        status:
          result.output &&
          result.output.trim() === String(tc.expectedOutput).trim()
            ? "pass"
            : "fail",
        error: result.error || null,
      });
    }

    res.json({ results });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
