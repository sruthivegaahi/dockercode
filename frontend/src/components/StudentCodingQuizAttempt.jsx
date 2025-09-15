import React, { useEffect, useState, useRef } from "react";
import { useParams,useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "./api";

const boilerplates = {
  javascript: `// Your code here
console.log("Hello, World!");`,

  python: `# Your code here
print("Hello, World!")`,

  java: `public class Main {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Hello, World!");
    }
}`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Your code here
    cout << "Hello, World!" << endl;
    return 0;
}`,
};

export default function StudentCodingQuizAttempt() {
  const { id } = useParams(); // problemId
  const navigate=useNavigate();
  // Problem & Code state
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(boilerplates.javascript);

  // Attempt state
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min default
  const [tabSwitches, setTabSwitches] = useState(0);
  const [cameraStream, setCameraStream] = useState(null);

  // Results
  const [results, setResults] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState(null);
  const [score, setScore] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false); // ✅ Prevent multiple submissions

  // Refs for cleanup
  const timerRef = useRef(null);
  const visibilityHandlerRef = useRef(null);

  // Determine if practice test
  const isPractice = problem?.quizType === "Practice Test";

  // Fetch problem
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/problems/student/coding");
        const selectedProblem = res.data.find((p) => p._id === id);

        if (!selectedProblem) {
          setError("This problem is not assigned to you.");
          return;
        }
        setProblem(selectedProblem);
        if (selectedProblem.duration) {
          setTimeLeft(selectedProblem.duration * 60);
        }
      } catch (err) {
        console.error("❌ Fetch problem failed:", err.response?.data || err.message);
        setError("Failed to load problem.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (visibilityHandlerRef.current)
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  // Start attempt
  const startAttempt = async () => {
    setAttemptStarted(true);

    if (isPractice) return; // skip all proctoring features for practice test

    // Timer
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Tab switch
    visibilityHandlerRef.current = () => {
      if (document.hidden) {
        setTabSwitches((c) => {
          if (c + 1 >= 3) {
            alert("❌ Too many tab switches. Auto-submitting.");
            handleSubmit(true);
          }
          return c + 1;
        });
      }
    };
    document.addEventListener("visibilitychange", visibilityHandlerRef.current);

    // Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch {
      alert("⚠ Camera is required for attempt.");
    }
  };

  // Language change
  const handleLanguageChange = (e) => {
    const selected = e.target.value;
    setLanguage(selected);
    setCode(boilerplates[selected] || "");
  };

  // Run visible test cases
  const handleRunCode = async () => {
    if (!problem) return;
    setRunning(true);
    setResults([]);
    setCustomOutput(null);
    try {
      const payload = { code, language, testCases: problem.testCases.filter((tc) => !tc.isHidden) };
      const res = await api.post("/api/problems/run", payload);

      setResults(
        (res.data.results || []).map((r) => ({
          input: r.input ?? "",
          expected: r.expected ?? r.expectedOutput ?? "",
          actual: r.actual ?? "",
          status: r.status ?? (r.error ? "error" : "fail"),
          error: r.error ?? null,
        }))
      );
    } catch (err) {
      console.error("❌ Run code failed:", err.response?.data || err.message);
      setResults([{ error: "Failed to run code." }]);
    } finally {
      setRunning(false);
    }
  };

  // Run with custom input
  const handleRunWithInput = async () => {
    if (!customInput.trim()) return alert("Enter custom input first.");
    setRunning(true);
    setCustomOutput(null);
    try {
      const payload = { code, language, customInput };
      const res = await api.post("/api/problems/run-custom", payload);
      const out = res.data.output || res.data.error || "No output";
      setCustomOutput(out);
    } catch (err) {
      console.error("❌ Custom run failed:", err.response?.data || err.message);
      setCustomOutput("Failed to run custom input.");
    } finally {
      setRunning(false);
    }
  };

  // Submit code
  // Submit code
const handleSubmit = async (auto = false) => {
  if (!problem || (submitted && !isPractice)) return; // ✅ allow multiple for practice
  setSubmitting(true);
  try {
    const payload = { problemId: problem._id, code, language };
    const res = await api.post("/api/problems/submit", payload);

    // Normalize results
    const resResults = res.data.results || [];
    setResults(
      resResults.map((r) => ({
        input: r.input ?? "",
        expected: r.expected ?? r.expectedOutput ?? "",
actual: r.output ?? r.stdout ?? "", // read from backend's actual output

        
        status: r.status ?? (r.error ? "error" : "fail"),
        error: r.error ?? null,
      }))
    );

    setScore(res.data.score ?? null);
    alert(auto ? "⏳ Auto-submitted!" : "✅ Submitted!");

    if (!isPractice) setSubmitted(true); // ✅ only lock for non-practice
    cleanup(); // stop timer + camera
  } catch (err) {
    console.error("❌ Submission failed:", err.response?.data || err.message);
    alert("❌ Submission failed.");
  } finally {
    setSubmitting(false);
  }
};


  // Stop everything if component unmounts
  useEffect(() => cleanup, []);

  // Disable navigation & refresh during attempt (only if not practice test)
  useEffect(() => {
    if (!attemptStarted || isPractice) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      alert("🚫 Navigation is disabled during the attempt!");
    };

    const handleLinkClick = (e) => {
      if (e.target.tagName === "A" || e.target.closest("a")) {
        e.preventDefault();
        alert("🚫 Navigation is disabled during the attempt!");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [attemptStarted, isPractice]);

  // Format timer mm:ss
  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;
  if (!problem) return <p className="text-center mt-20">No problem found.</p>;

  // Before start
  if (!attemptStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h2 className="text-3xl font-bold mb-4">{problem.title}</h2>
        <p className="text-gray-600 mb-6">
          Click below to start your attempt{!isPractice && ". Camera & timer will start."}
        </p>
        <button
          onClick={startAttempt}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition"
        >
          Start Attempt
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left: Problem */}
      <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-gray-200">
        <h2 className="text-2xl font-bold mb-2">{problem.title}</h2>
        <p className="text-gray-700 mb-6">{problem.description}</p>

        <h4 className="font-semibold mb-2">Sample Test Cases:</h4>
        {problem.testCases.filter((tc) => !tc.isHidden).length === 0 ? (
          <p className="text-gray-500">No public test cases.</p>
        ) : (
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            {problem.testCases.filter((tc) => !tc.isHidden).map((tc, i) => (
              <li key={i}>
                <strong>Input:</strong> {tc.input} | <strong>Expected:</strong> {tc.expectedOutput}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right: Editor */}
      <div className="w-full lg:w-1/2 p-6 flex flex-col relative">
        {/* Timer & Tab Switch (only if not practice test) */}
        {!isPractice && (
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold">⏳ {formatTime(timeLeft)}</span>
            <span className="text-sm text-gray-600">Tab Switches: {tabSwitches}/3</span>
          </div>
        )}

        {/* Camera */}
        {!isPractice && cameraStream && (
          <div
            className="fixed bottom-4 right-4 w-40 h-28 border-2 border-purple-600 rounded-lg shadow cursor-move bg-black"
            style={{ zIndex: 1000 }}
          >
            <video
              autoPlay
              muted
              playsInline
              ref={(v) => v && (v.srcObject = cameraStream)}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}

        {/* Language + Editor */}
        <div className="flex justify-between mb-3">
          <h3 className="text-lg font-semibold">Write Your Code</h3>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="border rounded-md p-2"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>
<Editor
  height="420px"
  theme="vs-dark"
  language={language === "cpp" ? "cpp" : language}
  value={code}
  onChange={(val) => setCode(val || "")}
  onMount={(editor) => {
    // Disable right-click menu
    editor.onContextMenu((e) => e.event.preventDefault());

    // Disable copy/cut/paste
    editor.onKeyDown((e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "x", "v"].includes(e.browserEvent.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    });

    // Disable mouse paste via middle-click
    editor.onMouseDown((e) => {
      if (e.event.middleButton) {
        e.event.preventDefault();
      }
    });
  }}
  options={{
    fontSize: 14,
    minimap: { enabled: false },
    wordWrap: "on",
    automaticLayout: true,
    contextmenu: false, // disable built-in context menu
  }}
  className="rounded border border-gray-300"
/>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleRunCode}
            disabled={running}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
          >
            {running ? "Running..." : "Run Code"}
          </button>
         <button
  onClick={() => handleSubmit(false)}
  disabled={submitting || (submitted && !isPractice)} // ✅ allow multiple submits for practice
  className={`px-4 py-2 rounded-lg shadow text-white ${
    submitted && !isPractice
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {submitted && !isPractice ? "Submitted" : submitting ? "Submitting..." : "Submit"}
</button>

        </div>

        {/* Custom Input */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Custom Input:</h4>
          <textarea
            rows={3}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter custom input here..."
            className="w-full border rounded-md p-2 text-sm"
          />
          <button
            onClick={handleRunWithInput}
            disabled={running}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 disabled:opacity-50"
          >
            Run with Custom Input
          </button>
          {customOutput && (
            <div className="mt-3 p-3 bg-gray-100 rounded border">
              <strong>Output:</strong>
              <pre className="mt-1 text-sm">{customOutput}</pre>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Results:</h4>
          {score !== null && (
            <div className="mb-3 p-3 bg-gray-100 rounded border text-lg font-semibold">
              🏆 Score: {score}%
            </div>
          )}
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Run or Submit code to see results.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="p-3 border rounded bg-white shadow-sm text-sm"
                >
                  {r.error ? (
                    <span className="text-red-500">❌ {r.error}</span>
                  ) : (
                    <>
                      <div>
                        <strong>Input:</strong> {r.input}
                      </div>
                      <div>
                        <strong>Expected:</strong> {r.expected}
                      </div>
                      <div>
                        <strong>Got:</strong> {r.actual}
                      </div>
                      <div className="mt-1">
                        {r.status === "pass" ? (
                          <span className="text-green-600 font-semibold">✔ Passed</span>
                        ) : (
                          <span className="text-red-600 font-semibold">✘ Failed</span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          
        </div>
        {/* Go to Dashboard button */}
{submitted && (
  <div className="text-center mt-6">
    <button
      onClick={() => navigate("/student/dashboard")}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow"
    >
      Go to Dashboard
    </button>
  </div>
)}

      </div>
    </div>
  );
}
