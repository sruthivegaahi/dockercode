
const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const tempDir = path.join(__dirname, "..", "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Helper to run Docker container
const runDocker = (language, fileName, input = "") => {
  return new Promise((resolve, reject) => {
    const containerName = `executor-${uuidv4()}`;
    const dockerImage = {
      python: "code_executor_python",
      javascript: "code_executor_node",
      cpp: "code_executor_cpp",
      java: "code_executor_java",
    }[language];

    if (!dockerImage) return reject("Unsupported language");

    const filePath = path.join(tempDir, fileName);
    const cmd = `docker run --rm -i --name ${containerName} -v ${filePath}:/code/${fileName} ${dockerImage} ${fileName}`;

    const child = exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout.trim());
    });

    if (child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
};

module.exports = { runDocker, tempDir };
