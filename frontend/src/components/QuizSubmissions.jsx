import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "./api";

const QuizSubmissions = () => {
  const { id } = useParams(); // quiz ID from URL
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/quiz/${id}/answers`);
        setSubmissions(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading submissions...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded mt-8">
      <h2 className="text-2xl font-bold mb-6">📋 Quiz Submissions</h2>

      {submissions.length === 0 ? (
        <p>No submissions yet for this quiz.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">User Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Answers</th>
              <th className="border px-4 py-2">Score</th>
              <th className="border px-4 py-2">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{submission.user?.name || "N/A"}</td>
                <td className="border px-4 py-2">{submission.user?.email || "N/A"}</td>
                <td className="border px-4 py-2">
                  <ul className="list-decimal list-inside">
                    {submission.answers.map((ans, idx) => (
                      <li key={idx}>Selected Option Index: {ans}</li>
                    ))}
                  </ul>
                </td>
                <td className="border px-4 py-2 font-semibold text-blue-700">
                  {submission.score}
                </td>
                <td className="border px-4 py-2">
                  {new Date(submission.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default QuizSubmissions;
