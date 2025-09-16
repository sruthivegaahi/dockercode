import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";

export default function ResultsList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/quizzes")
      .then((res) => setQuizzes(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10">Loading quizzes...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white shadow-xl rounded-xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-800">Quiz Results</h1>

      <div className="flex flex-col gap-4">
        {quizzes.map((quiz) => (
          <Link
            key={quiz._id}
            to={`/admin/quizzes/${quiz._id}/results`}
            className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 text-center"
          >
            {quiz.title} Results
          </Link>
        ))}

        <Link
          to="/admin/dashboard"
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 text-center mt-4"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
