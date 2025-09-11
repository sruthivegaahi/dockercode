// backend/utils/codeExecutor.js
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// __dirname is already available in CommonJS, no need for import.meta.url
// Temporary folder for user code
const tempDir = path.join(__dirname, "../temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Execute user-submitted code inside Docker
 * @param {string} code - Source code
 * @param {string} language - Programming language (e.g., 'python', 'cpp', 'java')
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
const executeCode = (code, language) => {
  return new Promise((resolve, reject) => {
    let fileName, dockerImage, runCmd;

    // Decide filename and docker image based on language
    switch (language) {
      case "python":
        fileName = "Main.py";
        dockerImage = "python:3.11";
        runCmd = `python3 /app/${fileName}`;
        break;

      case "cpp":
        fileName = "Main.cpp";
        dockerImage = "gcc:latest";
        runCmd = `g++ /app/${fileName} -o /app/a.out && /app/a.out`;
        break;

      case "java":
        fileName = "Main.java";
        dockerImage = "openjdk:17";
        runCmd = `javac /app/${fileName} && java -cp /app Main`;
        break;

      default:
        return reject(new Error("Unsupported language"));
    }

    // Save code to temp file
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code);

    // Run inside Docker
    const dockerCmd = `docker run --rm -v ${tempDir}:/app ${dockerImage} bash -c "${runCmd}"`;

    exec(dockerCmd, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        return resolve({ stdout, stderr: stderr || error.message });
      }
      resolve({ stdout, stderr });
    });
  });
};

module.exports = { executeCode };
