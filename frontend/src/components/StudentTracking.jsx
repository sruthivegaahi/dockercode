// src/components/StudentTracking.jsx
import React, { useEffect, useState } from "react";
import api from "./api";
import dayjs from "dayjs";

const StudentTracking = () => {
  const [tracking, setTracking] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // ✅ Fetch detailed tracking (attempt history)
        const trackingRes = await api.get("/api/quizzes/student/tracking");
        setTracking(Array.isArray(trackingRes.data) ? trackingRes.data : []);

        // ✅ Fetch summary (total / attempted / remaining)
        const summaryRes = await api.get("/api/quizzes/student/tracking-summary");
        setSummary(summaryRes.data || {});
      } catch (err) {
        console.error("❌ Error fetching tracking:", err);
        setError("Failed to fetch tracking data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <p className="text-center mt-20 text-lg text-gray-600">
        Loading tracking data...
      </p>
    );
  if (error)
    return <p className="text-center mt-20 text-red-500">{error}</p>;
  if (!tracking.length && !Object.keys(summary).length)
    return (
      <p className="text-center mt-20 text-gray-500">No attempts yet.</p>
    );

  // 🔥 Apply filter
  const filteredTracking = tracking.filter((item) => {
    if (filter === "All") return true;
    return item.quizType === filter;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
        Your Exam & Coding Submissions
      </h1>

      {/* 🔥 Summary Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {Object.entries(summary).map(([type, stats]) => (
          <div
            key={type}
            className="bg-white/80 border border-purple-200 rounded-2xl shadow p-5 text-center"
          >
            <h3 className="font-semibold text-lg mb-2">{type}</h3>
            <p className="text-gray-700">
              <span className="font-medium">Total:</span> {stats.total}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Attempted:</span>{" "}
              {stats.attempted}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Remaining:</span>{" "}
              {stats.remaining}
            </p>
          </div>
        ))}
      </div>

      {/* 🔥 Filter Buttons */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        {["All", "Grand Test", "Assignment", "Practice Test"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full border transition ${
              filter === type
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 🔥 Submissions */}
      {filteredTracking.length === 0 ? (
        <p className="text-center text-gray-500">
          No submissions for "{filter}".
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracking.map((item, idx) => {
            const title =
              item.type === "normal" ? item.quizTitle : item.problemTitle;

            // Score display
            let scoreDisplay = "";
            if (item.type === "normal") {
              scoreDisplay = `${item.score} / ${item.total}`;
            } else if (item.type === "coding") {
              const passed =
                Math.round((item.score / 100) * item.total) || 0;
              scoreDisplay = `${passed} / ${item.total}`;
            }

            return (
              <div
                key={idx}
                className="bg-white/70 backdrop-blur-md border border-purple-200 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-transform transform hover:-translate-y-1"
              >
                <h2 className="font-semibold text-xl mb-3 text-gray-800">
                  {item.type === "normal" ? "Quiz" : "Coding Problem"}:{" "}
                  <span className="text-purple-600">
                    {title || "Untitled"}
                  </span>
                </h2>

                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Score:</span>{" "}
                  {scoreDisplay}
                </p>

                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Attempted on:</span>{" "}
                  {item.date
                    ? dayjs(item.date).format("DD MMM YYYY, HH:mm")
                    : "-"}
                </p>

                <p className="text-gray-700">
                  <span className="font-medium">Type:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      item.quizType === "Grand Test"
                        ? "bg-red-100 text-red-700"
                        : item.quizType === "Assignment"
                        ? "bg-blue-100 text-blue-700"
                        : item.quizType === "Practice Test"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.quizType || "Unknown"}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentTracking;
