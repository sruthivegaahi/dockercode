import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSubmissions, setLastSubmissions] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/quizzes');
        setQuizzes(res.data);

        // Fetch last submission data for each quiz
        const submissionsArray = await Promise.all(
          res.data.map(async (quiz) => {
            try {
              const subRes = await api.get(`/api/quiz/${quiz._id}/last-submission`);
              return [quiz._id, subRes.data];
            } catch {
              return [quiz._id, null]; // No submission
            }
          })
        );

        setLastSubmissions(Object.fromEntries(submissionsArray));
      } catch (err) {
        console.error("Error loading quizzes or submissions", err);
        alert('Failed to fetch quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading quizzes...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📚 Available Quizzes</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => {
          const submission = lastSubmissions[quiz._id];
          let canRetake = true;
          let waitTime = null;

          if (submission?.createdAt) {
            const hoursSinceLast = (Date.now() - new Date(submission.createdAt)) / (1000 * 60 * 60);
            canRetake = hoursSinceLast >= 24;
            if (!canRetake) {
              waitTime = Math.ceil(24 - hoursSinceLast);
            }
          }

          return (
            <li key={quiz._id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{quiz.title}</h2>
              {quiz.description && <p className="text-gray-700">{quiz.description}</p>}

              {submission?.score !== undefined ? (
                <p className="text-green-600 mt-1">📝 Last Score: {submission.score}</p>
              ) : (
                <p className="text-yellow-600 mt-1">No attempts yet</p>
              )}

              {canRetake ? (
                <Link
                  to={`/quizzes/${quiz._id}/take`}
                  className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Take Quiz
                </Link>
              ) : (
                <p className="mt-2 text-red-500">
                  ⏳ You can attempt again in {waitTime} hour{waitTime > 1 ? 's' : ''}.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
