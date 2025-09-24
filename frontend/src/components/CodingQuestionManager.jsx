import { useEffect, useState } from "react";
import axios from "./api"; // your configured axios instance
import Swal from "sweetalert2";

export default function CodingQuestionManager() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [quizType, setQuizType] = useState("Grand Test");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [testCases, setTestCases] = useState([
    { input: "", expectedOutput: "", isHidden: false },
  ]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get("/api/problems");
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      { input: "", expectedOutput: "", isHidden: false },
    ]);
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return Swal.fire("Warning", "Title and Description are required!", "warning");
    }

    // ⏰ Require time window for Grand Test / Assignment
    if (
      (quizType === "Grand Test" || quizType === "Assignment") &&
      (!startTime || !endTime)
    ) {
      return Swal.fire(
        "Warning",
        "Start and End times are required for this quiz type.",
        "warning"
      );
    }

    try {
      const payload = {
        title,
        description,
        difficulty,
        quizType,
        testCases,
        startTime: startTime || null,
        endTime: endTime || null,
      };

      await axios.post("/api/problems", payload);
      Swal.fire("Success", "Coding question added!", "success");

      // Reset form
      setTitle("");
      setDescription("");
      setDifficulty("Easy");
      setQuizType("Grand Test");
      setStartTime("");
      setEndTime("");
      setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);

      fetchQuestions();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add question", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
          Coding Question Manager
        </h2>

        {/* ➕ Add New Question */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-indigo-600">
            Add New Question
          </h3>

          <input
            className="w-full p-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full p-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            className="w-full p-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <select
            className="w-full p-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={quizType}
            onChange={(e) => setQuizType(e.target.value)}
          >
            <option value="Grand Test">Grand Test</option>
            <option value="Assignment">Assignment</option>
            <option value="Practice Test">Practice Test</option>
          </select>

          {/* 🕒 Start/End Time only for Grand Test or Assignment */}
          {(quizType === "Grand Test" || quizType === "Assignment") && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time:
              </label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">
                End Time:
              </label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          )}

          {/* Test Cases */}
          <h4 className="font-semibold text-indigo-600 mb-2">Test Cases</h4>
          {testCases.map((tc, i) => (
            <div key={i} className="mb-3 p-3 border rounded-lg bg-white">
              <input
                className="w-full p-2 mb-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Input"
                value={tc.input}
                onChange={(e) => handleTestCaseChange(i, "input", e.target.value)}
              />
              <input
                className="w-full p-2 mb-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Expected Output"
                value={tc.expectedOutput}
                onChange={(e) =>
                  handleTestCaseChange(i, "expectedOutput", e.target.value)
                }
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={tc.isHidden}
                  onChange={(e) =>
                    handleTestCaseChange(i, "isHidden", e.target.checked)
                  }
                />
                <label className="text-sm text-gray-700">Hidden</label>
              </div>
            </div>
          ))}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            onClick={handleAddTestCase}
          >
            + Add Test Case
          </button>

          <div className="mt-4">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              onClick={handleSubmit}
            >
              Submit Question
            </button>
          </div>
        </div>

        {/* 📋 Existing Questions */}
        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-indigo-600">
            Existing Questions
          </h3>
          {loading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-gray-500">No coding questions added yet.</p>
          ) : (
            <ul className="space-y-2">
              {questions.map((q) => (
                <li
                  key={q._id}
                  className="p-3 bg-white border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-sm text-gray-500">
                      {q.difficulty} | {q.quizType}
                      {q.startTime &&
                        q.endTime &&
                        ` | ${new Date(q.startTime).toLocaleString()} → ${new Date(
                          q.endTime
                        ).toLocaleString()}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
