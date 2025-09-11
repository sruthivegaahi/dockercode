import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
import { FileText, Clock } from 'lucide-react';

const quizTypes = ['Grand Test', 'Assignment', 'Practice Test'];

export default function UserQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [attemptStatus, setAttemptStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('Grand Test');
  const [now, setNow] = useState(new Date());

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch quizzes and attempt status
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await api.get('/api/quizzes/student/assigned');
        setQuizzes(res.data);

        const statuses = {};
        for (const quiz of res.data) {
          try {
            const response = await api.get(`/api/quizzes/${quiz._id}/check-attempt`);
            statuses[quiz._id] = response.data;
          } catch {
            statuses[quiz._id] = { attempted: false };
          }
        }
        setAttemptStatus(statuses);
      } catch {
        setError('Failed to load quizzes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter(q => q.quizType === activeType);

  // Check if quiz is currently active
  const isQuizActive = (quiz) => {
    if (quiz.quizType === 'Practice Test') return true;
    if (!quiz.startTime || !quiz.endTime) return false;

    const start = new Date(quiz.startTime);
    const end = new Date(quiz.endTime);
    return now >= start && now <= end;
  };

  // Remaining time for countdown display
  const getTimeLeft = (quiz) => {
    if (quiz.quizType === 'Practice Test') return null;
    if (!quiz.endTime) return 0;

    const end = new Date(quiz.endTime);
    const diff = Math.floor((end - now) / 1000);
    return diff > 0 ? diff : 0;
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`;
  };

  if (loading) return <p className="text-center mt-20 text-lg">Loading quizzes...</p>;
  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-fuchsia-200 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-fuchsia-600 to-purple-700 bg-clip-text text-transparent mb-12">
          Available Quizzes
        </h2>

        {/* Quiz Type Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          {quizTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-6 py-2 rounded-full font-semibold shadow transition-colors duration-200 ${
                activeType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
              }`}
            >
              {type} ({quizzes.filter(q => q.quizType === type).length})
            </button>
          ))}
        </div>

        {filteredQuizzes.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No {activeType} quizzes assigned.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuizzes.map((quiz) => {
              const status = attemptStatus[quiz._id];
              const active = isQuizActive(quiz);
              const canAttempt = (quiz.quizType === 'Practice Test' || !status?.attempted) && active;
              const timeLeft = getTimeLeft(quiz);

              return (
                <div
                  key={quiz._id}
                  className="bg-white/60 backdrop-blur-md border border-pink-200 shadow-2xl rounded-2xl p-6 transition transform hover:-translate-y-1 hover:shadow-pink-300/60 duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="text-fuchsia-600 w-6 h-6" />
                    <h3 className="text-xl font-semibold text-gray-800">{quiz.title}</h3>
                    {quiz.quizType === 'Practice Test' && (
                      <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-semibold">
                        Practice
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {quiz.description || 'No description provided.'}
                  </p>

                  {/* Quiz availability */}
                  {quiz.quizType !== 'Practice Test' && quiz.startTime && quiz.endTime && (
                    <div className="flex items-center gap-2 text-sm text-purple-700 font-medium mb-3">
                      <Clock className="w-4 h-4" />
                      <span>
                        ⏳ Available:{" "}
                        <span className="font-semibold">
                          {new Date(quiz.startTime).toLocaleString()} 
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold">
                          {new Date(quiz.endTime).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Countdown */}
                  {active && quiz.quizType !== 'Practice Test' && (
                    <p className="text-sm text-purple-800 font-medium mb-2">
                      Time Left: {formatTime(timeLeft)}
                    </p>
                  )}

                  {/* Not available notice */}
                  {!canAttempt && status?.attempted && !active && (
                    <p
                      className="text-sm text-red-500 text-center mb-2 font-medium"
                      title="You have already attempted this quiz or it is outside the availability window."
                    >
                      Not Available
                    </p>
                  )}

                  <Link
                    to={`/student/quiz/${quiz._id}`}
                    state={{ quizType: quiz.quizType }}
                    className={`inline-block w-full text-center text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-md ${
                      canAttempt
                        ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-pink-500'
                        : 'bg-gray-400 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    {canAttempt ? 'Take Quiz' : 'Unavailable'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
