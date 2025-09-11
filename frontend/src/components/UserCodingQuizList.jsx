import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import { Code } from "lucide-react";

export default function UserCodingQuizList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizTypeFilter, setQuizTypeFilter] = useState("Grand Test");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const fetchAssignedCodingProblems = async () => {
      try {
        const res = await api.get("/api/problems/student/coding-with-status");
        setProblems(res.data);
      } catch (err) {
        setError("Failed to load assigned coding problems. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedCodingProblems();

    // Update current time every second to show live countdown
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-center mt-20 text-lg">Loading coding problems...</p>;
  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;

  const filteredProblems = problems.filter(p => p.quizType === quizTypeFilter);
  const quizTypes = ["Grand Test", "Assignment", "Practice Test"];

  const formatCountdown = (dateStr) => {
    if (!dateStr) return "0h 0m";
    const target = new Date(dateStr);
    const diff = target - now;
    if (diff <= 0) return "0h 0m";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-fuchsia-200 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-700 bg-clip-text text-transparent mb-8">
          Assigned Coding Problems
        </h2>

        {/* Quiz Type Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          {quizTypes.map((type) => (
            <button
              key={type}
              onClick={() => setQuizTypeFilter(type)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                quizTypeFilter === type
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-purple-300 hover:bg-purple-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {filteredProblems.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">
            No {quizTypeFilter} problems assigned to your college/branch.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProblems.map((problem) => {
              let buttonText = "Attempt Problem";

              // Cooldown / availability logic
              if (!problem.canAttempt) {
                if (problem.availabilityMessage?.startsWith("Available from")) {
                  buttonText = `Available in ${formatCountdown(problem.startTime)}`;
                } else if (problem.availabilityMessage?.startsWith("Ended")) {
                  buttonText = problem.availabilityMessage;
                } else if (problem.cooldownHours > 0) {
                  buttonText = `Wait ${problem.cooldownHours}h to reattempt`;
                } else {
                  buttonText = "Cannot Attempt Now";
                }
              }

              return (
                <div
                  key={problem._id}
                  className="bg-white/60 backdrop-blur-md border border-pink-200 shadow-2xl rounded-2xl p-6 transition transform hover:-translate-y-1 hover:shadow-pink-300/60 duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Code className="text-purple-600 w-6 h-6" />
                    <h3 className="text-xl font-semibold text-gray-800">{problem.title}</h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {problem.description || "No description provided."}
                  </p>

                  <p className="text-gray-500 text-xs mb-4">
                    Difficulty: <span className="font-medium">{problem.difficulty}</span> |{" "}
                    Test Cases: <span className="font-medium">{problem.testCases?.length || 0}</span>
                  </p>

                  {problem.canAttempt ? (
                    <Link
                      to={`/student/coding-quiz/${problem._id}`}
                      className="inline-block w-full text-center text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-md bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-pink-500"
                    >
                      {buttonText}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-block w-full text-center text-gray-400 text-sm font-semibold px-4 py-2 rounded-lg bg-gray-200 cursor-not-allowed"
                    >
                      {buttonText}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
