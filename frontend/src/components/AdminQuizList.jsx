import React, { useEffect, useState } from "react";
import api from "./api";
import { Link } from "react-router-dom";

const AdminQuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState(""); // "quiz" or "coding"
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Edit modal state for coding problems
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProblem, setEditProblem] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [quizRes, codingRes, collegeRes, branchRes] = await Promise.all([
        api.get("/api/quizzes"),
        api.get("/api/problems"),
        api.get("/api/users/colleges"),
        api.get("/api/users/branches"),
      ]);
      
      setQuizzes(quizRes.data);
      setCodingQuestions(codingRes.data);
      setColleges(collegeRes.data);
      setAllBranches(branchRes.data);
      setFilteredBranches([]);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollege) {
      const filtered = allBranches
        .filter((b) => b.college === selectedCollege)
        .map((b) => b.branch);
      setFilteredBranches(filtered);
      setSelectedBranch("");
    } else {
      setFilteredBranches([]);
      setSelectedBranch("");
    }
  }, [selectedCollege, allBranches]);

  const deleteQuiz = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await api.delete(`/api/quizzes/${id}`);
      fetchInitialData();
    } catch (err) {
      alert(
        "Failed to delete quiz: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const deleteCodingQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coding question?"))
      return;
    try {
      await api.delete(`/api/problems/${id}`);
      fetchInitialData();
      alert("question deleted sucessfully")
    } catch (err) {
      alert(
        "Failed to delete coding question: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const openAssignModal = (id, type) => {
    setSelectedId(id);
    setAssignType(type); // "quiz" or "coding"
    setSelectedCollege("");
    setSelectedBranch("");
    setShowAssignModal(true);
  };

  const assignItem = async () => {
    if (!selectedCollege || !selectedBranch) {
      return alert("Please select both college and branch.");
    }

    try {
      let url = "";
      if (assignType === "quiz") {
        url = "/api/quizzes/assign";
      } else if (assignType === "coding") {
        url = "/api/problems/assign";
      }

      const res = await api.post(url, {
          quizId: selectedId,
        collegeName: selectedCollege,
        branch: selectedBranch,
      });

      console.log("✅ Success:", res.data);
      
      setShowAssignModal(false);
      fetchInitialData();
      alert("Assigned successfully!");
      
    } catch (err) {
      alert(
        "Failed to assign: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const openEditModal = (problem) => {
    // ensure testCases exist
    const safeProblem = { ...problem, testCases: problem.testCases || [] };
    setEditProblem(safeProblem);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProblem((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...editProblem.testCases];
    updated[index][field] = value;
    setEditProblem((prev) => ({ ...prev, testCases: updated }));
  };

  const addTestCase = () => {
    setEditProblem((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        { input: "", expectedOutput: "", isHidden: false },
      ],
    }));
  };

  const removeTestCase = (index) => {
    const updated = [...editProblem.testCases];
    updated.splice(index, 1);
    setEditProblem((prev) => ({ ...prev, testCases: updated }));
  };

  const saveEditedProblem = async () => {
    try {
      await api.put(`/api/problems/${editProblem._id}`, editProblem);
      setShowEditModal(false);
      setEditProblem(null);
      fetchInitialData();
      alert("Problem updated successfully!");
    } catch (err) {
      alert(
        "Failed to update problem: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-10 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 rounded-3xl shadow-xl">
      <h1 className="text-5xl font-extrabold mb-12 text-center text-indigo-900 tracking-wide drop-shadow-md">
        Manage Quizzes & Coding Questions
      </h1>

      {loading && (
        <p className="text-center text-indigo-400 text-xl animate-pulse">
          Loading...
        </p>
      )}
      {error && (
        <p className="text-center text-red-600 font-semibold mb-6">{error}</p>
      )}

      {/* Quizzes Section */}
      <h2 className="text-3xl font-bold mb-6 text-indigo-800">Quizzes</h2>
      {!loading && quizzes.length === 0 && (
        <p className="text-center text-gray-600 text-xl italic">
          No quizzes found.
        </p>
      )}
      {!loading && quizzes.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-indigo-200 shadow-lg bg-white mb-12">
          <table className="min-w-full divide-y divide-indigo-200">
            <thead className="bg-indigo-100">
              <tr>
                <th className="px-8 py-4 text-left text-lg font-semibold text-indigo-700">
                  Title
                </th>
                <th className="px-8 py-4 text-center text-lg font-semibold text-indigo-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-200 bg-white">
              {quizzes.map((quiz) => (
                <tr
                  key={quiz._id}
                  className="hover:bg-indigo-50 transition-colors duration-300"
                >
                  <td className="px-8 py-5 text-indigo-900 font-semibold text-xl">
                    {quiz.title}
                  </td>
                  <td className="px-8 py-5 text-center space-x-3">
                    <Link
                      to={`/admin/quizzes/${quiz._id}/edit`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => openAssignModal(quiz._id, "quiz")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Coding Questions Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-indigo-800">Coding Questions</h2>
    
      </div>

      {!loading && codingQuestions.length === 0 && (
        <p className="text-center text-gray-600 text-xl italic">
          No coding questions found.
        </p>
      )}
      {!loading && codingQuestions.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-indigo-200 shadow-lg bg-white">
          <table className="min-w-full divide-y divide-indigo-200">
            <thead className="bg-indigo-100">
              <tr>
                <th className="px-8 py-4 text-left text-lg font-semibold text-indigo-700">
                  Title
                </th>
                <th className="px-8 py-4 text-left text-lg font-semibold text-indigo-700">
                  Difficulty
                </th>
                <th className="px-8 py-4 text-center text-lg font-semibold text-indigo-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-200 bg-white">
              {codingQuestions.map((q) => (
                <tr
                  key={q._id}
                  className="hover:bg-indigo-50 transition-colors duration-300"
                >
                  <td className="px-8 py-5 text-indigo-900 font-semibold text-xl">
                    {q.title}
                  </td>
                  <td className="px-8 py-5">{q.difficulty}</td>
                  <td className="px-8 py-5 text-center space-x-3">
                    <button
                      onClick={() => openEditModal(q)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openAssignModal(q._id, "coding")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => deleteCodingQuestion(q._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-indigo-800 mb-4">
              Assign {assignType === "quiz" ? "Quiz" : "Coding Question"}
            </h2>

            <div className="mb-4">
              <label className="block text-indigo-700 font-semibold mb-2">
                Select College
              </label>
              <select
                className="w-full border rounded p-2"
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
              >
                <option value="">-- Select College --</option>
                {colleges.map((college, index) => (
                  <option key={index} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-indigo-700 font-semibold mb-2">
                Select Branch
              </label>
              <select
                className="w-full border rounded p-2"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!selectedCollege}
              >
                <option value="">-- Select Branch --</option>
                {filteredBranches.map((branch, index) => (
                  <option key={index} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={assignItem}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coding Question Modal */}
      {showEditModal && editProblem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-indigo-800 mb-6">
              Edit Coding Question
            </h2>

            <div className="mb-4">
              <label className="block text-indigo-700 font-semibold mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={editProblem.title}
                onChange={handleEditChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-indigo-700 font-semibold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={editProblem.description}
                onChange={handleEditChange}
                rows={4}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-6">
              <label className="block text-indigo-700 font-semibold mb-2">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={editProblem.difficulty}
                onChange={handleEditChange}
                className="w-full border rounded p-2"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Test Cases Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-indigo-700 mb-3">
                Test Cases
              </h3>
              {editProblem.testCases.map((tc, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 mb-3 bg-indigo-50"
                >
                  <label className="block font-semibold text-sm text-indigo-700">
                    Input
                  </label>
                  <input
                    type="text"
                    value={tc.input}
                    onChange={(e) =>
                      handleTestCaseChange(index, "input", e.target.value)
                    }
                    className="w-full border rounded p-2 mb-2"
                  />

                  <label className="block font-semibold text-sm text-indigo-700">
                    Expected Output
                  </label>
                  <input
                    type="text"
                    value={tc.expectedOutput}
                    onChange={(e) =>
                      handleTestCaseChange(
                        index,
                        "expectedOutput",
                        e.target.value
                      )
                    }
                    className="w-full border rounded p-2 mb-2"
                  />

                  <label className="inline-flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={tc.isHidden}
                      onChange={(e) =>
                        handleTestCaseChange(
                          index,
                          "isHidden",
                          e.target.checked
                        )
                      }
                      className="mr-2"
                    />
                    Hidden Test Case
                  </label>

                  <button
                    onClick={() => removeTestCase(index)}
                    className="mt-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={addTestCase}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                + Add Test Case
              </button>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedProblem}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizList;
