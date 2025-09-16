import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import api from './api';
import Webcam from 'react-webcam';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2700);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewData, setReviewData] = useState([]);

  const answersRef = useRef([]);
  const webcamRef = useRef(null);

  const videoConstraints = { width: 200, height: 150, facingMode: 'user' };

  // Check if quiz is a practice test
  const isPracticeTest = quiz?.quizType === 'Practice Test';

  // Check if quiz is currently active (time validation)
  const isQuizActive = () => {
    if (!quiz || isPracticeTest) return true; // practice tests always active
    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(quiz.endTime);
    return now >= start && now <= end;
  };

  // Fetch quiz and restore state
  useEffect(() => {
    const savedTime = localStorage.getItem(`quiz-${id}-timer`);
    const savedAnswers = localStorage.getItem(`quiz-${id}-answers`);
    const savedStartTime = localStorage.getItem(`quiz-${id}-startTime`);

    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/api/quizzes/${id}`);
        setQuiz(res.data); // always set the quiz

        // Restore previous answers if available
        let restoredAnswers = res.data.questions.map(q => ({ type: q.type, answer: '' }));
        if (savedAnswers) {
          const parsed = JSON.parse(savedAnswers);
          if (Array.isArray(parsed)) restoredAnswers = parsed;
        }
        setAnswers(restoredAnswers);
        answersRef.current = restoredAnswers;

        // Restore timer if available
        setTimeLeft(savedTime && !isNaN(savedTime) ? parseInt(savedTime, 10) : 2700);

        // Restore or initialize start time
        if (savedStartTime) {
          setStartTime(savedStartTime);
        } else {
          const now = new Date().toISOString();
          setStartTime(now);
          localStorage.setItem(`quiz-${id}-startTime`, now);
        }
      } catch (error) {
        toast.error('Failed to load quiz');
        navigate('/student/dashboard');
      }
    };

    fetchQuiz();
  }, [id, navigate]);

  // Hide camera when submitted or terminated
  useEffect(() => {
    if (submitted || terminated) setShowCamera(false);
  }, [submitted, terminated]);

  // Detect tab switching (only if not practice test)
  useEffect(() => {
    if (isPracticeTest) return;

    const handleTabChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const updated = prev + 1;
          if (updated >= 3) terminateQuiz();
          else
            toast.warn(`⚠️ Tab switch detected! (${updated}/3)`, {
              position: 'top-center',
              autoClose: 5000,
              theme: 'colored',
            });
          return updated;
        });
      }
    };
    document.addEventListener('visibilitychange', handleTabChange);
    return () => document.removeEventListener('visibilitychange', handleTabChange);
  }, [submitted, terminated, isPracticeTest]);

  // Timer countdown (only if not practice test)
  useEffect(() => {
    if (submitted || terminated || isPracticeTest) return;
    if (timeLeft <= 0) { autoSubmit(); return; }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const updated = prev - 1;
        localStorage.setItem(`quiz-${id}-timer`, updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitted, terminated, id, isPracticeTest]);

  // Prevent back navigation (only if not practice test)
  useEffect(() => {
    if (submitted || terminated || isPracticeTest) return;

    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      toast.warn('⚠️ Navigation disabled during quiz!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [submitted, terminated, isPracticeTest]);

  // Save answers on unload
  useEffect(() => {
    const saveBeforeUnload = () => {
      localStorage.setItem(`quiz-${id}-answers`, JSON.stringify(answersRef.current));
    };
    window.addEventListener('beforeunload', saveBeforeUnload);
    return () => window.removeEventListener('beforeunload', saveBeforeUnload);
  }, [id]);

  const formatTime = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleChange = (index, value, type) => {
    const updated = [...answers];
    updated[index] = { type, answer: type === 'mcq' ? parseInt(value) : value };
    setAnswers(updated);
    answersRef.current = [...updated];
    localStorage.setItem(`quiz-${id}-answers`, JSON.stringify(updated));
  };

  const fetchReview = async () => {
    try {
      const reviewRes = await api.get(`/api/quizzes/${id}/review`);
      setReviewData(reviewRes.data.review);
      setReviewMode(true);
    } catch (err) {
      toast.error('Failed to fetch review data.');
    }
  };

  const autoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/api/quizzes/${id}/answer`, {
        answers: answersRef.current,
        terminated: false,
        startTime,
      });
      setSubmitted(true);
      localStorage.removeItem(`quiz-${id}-timer`);
      localStorage.removeItem(`quiz-${id}-answers`);
      localStorage.removeItem(`quiz-${id}-startTime`);

      await Swal.fire({
        icon: 'info',
        title: '⏰ Time’s up!',
        text: `Your quiz has been auto-submitted. You can review your answers below.`,
      });

      await fetchReview();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Auto-submit failed',
        text: 'Something went wrong. Please try again.',
      });
    }
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Submit Quiz?',
      text: 'Are you sure you want to submit your answers?',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      await api.post(`/api/quizzes/${id}/answer`, {
        answers: answersRef.current,
        terminated: false,
        startTime,
      });
      setSubmitted(true);
      localStorage.removeItem(`quiz-${id}-timer`);
      localStorage.removeItem(`quiz-${id}-answers`);
      localStorage.removeItem(`quiz-${id}-startTime`);

      toast.success('✅ Answers submitted successfully!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
      });

      await fetchReview();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Submission failed',
        text: 'Unable to submit your quiz. Please try again.',
      });
    }
    setSubmitting(false);
  };

  const terminateQuiz = async () => {
    setTerminated(true);
    alert("Quiz terminated due to tab switching!");
    try {
      const response = await api.post(`/api/quizzes/${id}/answer`, {
        answers: answersRef.current,
        terminated: true,
        startTime,
      });
      localStorage.removeItem(`quiz-${id}-timer`);
      localStorage.removeItem(`quiz-${id}-answers`);
      localStorage.removeItem(`quiz-${id}-startTime`);
      if (response.data.message === "Quiz submitted successfully") {
        navigate("/result", {
          state: {
            score: response.data.score,
            total: quiz.questions.length,
          },
        });
      }
    } catch (err) {
      console.error("Error submitting terminated quiz:", err);
    }
  };

  if (!quiz) return <div className="text-center mt-10 text-lg">Loading quiz...</div>;


  if (terminated) {
    return (
      <div className="p-6 text-center text-red-600 text-xl font-bold">
        🚫 Quiz terminated due to switching tabs 3 times.<br />
        Your answers have been submitted.
      </div>
    );
  }

  // Prepare PieChart data for review
  const totalQuestions = reviewData.length;
const correctAnswers = reviewData.filter(q => q.isCorrect).length;
const unanswered = reviewData.filter(q => q.studentAnswer === null || q.studentAnswer === undefined || q.studentAnswer === '').length;
const wrongAnswers = totalQuestions - correctAnswers - unanswered;

  const chartData = [
    { name: 'Correct', value: correctAnswers },
    { name: 'Wrong', value: wrongAnswers },
    { name: 'Unanswered', value: unanswered },
  ];
  const COLORS = ['#4caf50', '#f44336', '#ff9800'];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-extrabold text-purple-700">{quiz.title}</h2>
        {!isPracticeTest && (
          <div className="text-xl font-bold text-pink-600 bg-pink-100 px-4 py-2 rounded-full shadow">
            Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Quiz Questions */}
      {!reviewMode && quiz.questions.map((q, idx) => (
        <div key={idx} className="mb-10 p-6 rounded-2xl shadow-xl border border-pink-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex text-xl font-semibold text-purple-900 mb-6 font-mono">
            <div className="mr-2">{idx + 1}.</div>
            <div className="whitespace-pre-line break-all">{q.questionText || q.question}</div>

          </div>
          {q.type === 'fill_blank' ? (
            <input
              type="text"
              value={answers[idx]?.answer ?? ''}
              onChange={(e) => handleChange(idx, e.target.value, q.type)}
              disabled={submitted || terminated || reviewMode}
              placeholder="Type your answer here..."
              className="w-full p-3 border rounded focus:outline-none focus:ring focus:border-blue-500"
            />
          ) : (
            <div className="grid gap-4">
              {q.options.map((opt, optIdx) => {
                const isSelected = parseInt(answers[idx]?.answer) === optIdx;
                let base = 'p-4 rounded-xl cursor-pointer transition duration-200 border text-base font-medium';
                let style = 'bg-white border-gray-300 hover:bg-pink-100 text-purple-900';
                if (submitted || terminated || reviewMode) style = 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed';
                else if (isSelected) style = 'bg-purple-100 border-purple-500 text-purple-900 shadow-md';
                return (
                  <label key={optIdx} className={`${base} ${style}`} tabIndex={0}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`question-${idx}`}
                        value={optIdx}
                        checked={isSelected}
                        onChange={() => handleChange(idx, optIdx, q.type)}
                        className="hidden"
                        disabled={submitted || terminated || reviewMode}
                      />
                      <span className="flex items-center gap-2">
                        {isSelected && <span className="text-green-600 font-bold">✓</span>}
                        {opt}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Submit Button */}
      {!submitted && !terminated && !reviewMode && (
        <div className="text-center mt-10">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-full shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answers
          </button>
        </div>
      )}

      {/* Webcam Preview (only if not practice test) */}
      {showCamera && !isPracticeTest && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            border: '3px solid #a855f7',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'white',
            width: '200px',
            height: '150px',
          }}
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
          />
        </div>
      )}

      {/* Review Section */}
      {reviewMode && reviewData.length > 0 && (
        <div className="mt-10">
          <h3 className="text-2xl font-bold text-purple-700 mb-4">Review Your Answers</h3>
          <div className="flex justify-center mb-6">
            <PieChart width={500} height={300}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          {reviewData.map((q, idx) => (
            <div key={idx} className="mb-6 p-4 border rounded-lg bg-purple-50">
             <p className="font-semibold text-purple-900 whitespace-pre-line break-words">
  {idx + 1}. {q.question}
</p>

              {q.type === 'mcq' && (
                <ul className="list-disc ml-6 mt-2">
                  {q.options.map((opt, optIdx) => {
                    let style = '';
                    if (optIdx === q.studentAnswer) style = 'text-red-600 font-bold';
                    if (optIdx === q.correctAnswer) style = 'text-green-600 font-bold';
                    return <li key={optIdx} className={style}>{opt}</li>;
                  })}
                </ul>
              )}
              {q.type === 'fill_blank' && (
                <p>
                  Your Answer: <span className={q.isCorrect ? 'text-green-600' : 'text-red-600 font-bold'}>{q.studentAnswer || 'No Answer'}</span><br/>
                  Correct Answer: <span className="text-green-600 font-bold">{q.correctAnswer}</span>
                </p>
              )}
            </div>
          ))}

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
