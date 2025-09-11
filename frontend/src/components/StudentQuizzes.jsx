import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const StudentQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedType, setSelectedType] = useState("Grand Test");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/quizzes/student"); // assigned quizzes
        setQuizzes(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter(
    (q) => q.quizType.toLowerCase() === selectedType.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto p-10">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-indigo-900">
        Your Quizzes
      </h1>

      {/* Quiz Type Tabs */}
      <div className="flex justify-center gap-6 mb-10">
        {["Grand Test", "Assignment", "Practice Test"].map((type) => (
          <button
            key={type}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              selectedType === type
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-indigo-200 text-indigo-900"
            }`}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-indigo-500 animate-pulse">Loading...</p>
      ) : filteredQuizzes.length === 0 ? (
        <p className="text-center text-gray-600 italic">
          No {selectedType} assigned yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="p-6 rounded-2xl shadow-lg bg-white hover:shadow-2xl cursor-pointer transition"
              onClick={() => navigate(`/student/quiz/${quiz._id}`)}
            >
              <h2 className="text-2xl font-bold text-indigo-900 mb-2">
                {quiz.title}
              </h2>
              <p className="text-gray-700">Questions: {quiz.questions.length}</p>
              <p className="text-gray-600">Type: {quiz.quizType}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentQuizzes;
