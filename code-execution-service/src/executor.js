const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const tempDir = path.join(__dirname, "..", "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

async function runCode({ code, language, input = "" }) {
  const fileId = uuidv4();
  let fileName, compileCmd, runCmd;

  try {
    if (language === "python") {
      fileName = `${fileId}.py`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      runCmd = `python3 ${fileName}`;
    } else if (language === "javascript") {
      fileName = `${fileId}.js`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      runCmd = `node ${fileName}`;
    } else if (language === "cpp") {
      fileName = `${fileId}.cpp`;
      const exeFile = `${fileId}.out`;
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `g++ ${fileName} -o ${exeFile}`;
      runCmd = `./${exeFile}`;
    } else if (language === "java") {
      fileName = "Main.java";
      fs.writeFileSync(path.join(tempDir, fileName), code);
      compileCmd = `javac ${fileName}`;
      runCmd = `java Main`;
    } else {
      return { error: "Unsupported language" };
    }

    // Compile if needed
    if (compileCmd) {
      await new Promise((resolve, reject) => {
        exec(compileCmd, { cwd: tempDir, timeout: 5000 }, (err, stdout, stderr) => {
          if (err) return reject(stderr || err.message);
          resolve();
        });
      });
    }

    // Run the code
    const output = await new Promise((resolve, reject) => {
      const child = exec(runCmd, { cwd: tempDir, timeout: 5000 }, (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        resolve(stdout.trim());
      });

      if (child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }
    });

    return { output };
  } catch (err) {
    return { error: err.toString() };
  } finally {
    // Clean up files
    try {
      if (fileName && fs.existsSync(path.join(tempDir, fileName))) fs.unlinkSync(path.join(tempDir, fileName));
      if (language === "cpp") {
        const exeFile = `${fileId}.out`;
        if (fs.existsSync(path.join(tempDir, exeFile))) fs.unlinkSync(path.join(tempDir, exeFile));
      }
      if (language === "java") {
        const classFile = "Main.class";
        if (fs.existsSync(path.join(tempDir, classFile))) fs.unlinkSync(path.join(tempDir, classFile));
      }
    } catch {}
  }
}

module.exports = { runCode };
