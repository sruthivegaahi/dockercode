import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import api from "./api";

export default function QuizReview() {
  const { quizId } = useParams();
  const [review, setReview] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
  }, [quizId]);

  const fetchReview = async () => {
    try {
      const res = await api.get(`/api/quizzes/${quizId}/review`);
      setReview(res.data.review || []);
      setQuizTitle(res.data.quizTitle || "Quiz");
    } catch (err) {
      console.error(err);
      setReview([]);
      setQuizTitle("Quiz");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-5">Loading...</p>;

  // --- Calculate scores safely ---
  const totalQuestions = reviewData.length;
const correctAnswers = reviewData.filter(q => q.isCorrect).length;
const unanswered = reviewData.filter(q => q.studentAnswer === null || q.studentAnswer === undefined || q.studentAnswer === '').length;
const wrongAnswers = totalQuestions - correctAnswers - unanswered;


  const chartData = [
    { name: "Correct", value: correctAnswers },
    { name: "Wrong", value: wrongAnswers },
    { name: "Unanswered", value: unanswered },
  ];

  const COLORS = ["#4caf50", "#f44336", "#9e9e9e"]; // green, red, gray

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded">
      <h1 className="text-2xl font-bold mb-2 text-center">{quizTitle} - Review</h1>
      <p className="text-center text-lg mb-6">
        Score: <span className="font-bold">{correctAnswers}</span> / {totalQuestions}
      </p>

      {/* --- Pie Chart --- */}
      <div className="flex justify-center mb-6" style={{ minHeight: 350 }}>
        {totalQuestions > 0 ? (
          <PieChart width={300} height={300}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        ) : (
          <p className="text-center text-gray-500">No answers to display.</p>
        )}
      </div>

      {/* --- Question Review --- */}
      {review.map((q, idx) => (
        <div key={idx} className="mb-4 p-4 border rounded bg-gray-50">
          <p className="font-semibold mb-2">
            {idx + 1}. {q.question}
          </p>

          {/* Multiple Choice */}
          {q.type === "mcq" && (
            <ul className="list-disc ml-5 space-y-1">
              {q.options.map((opt, i) => {
                const isCorrect = opt === q.correctAnswer;
                const isStudent = opt === q.studentAnswer;
                return (
                  <li
                    key={i}
                    className={`${
                      isCorrect ? "text-green-600 font-bold" : ""
                    } ${isStudent && !isCorrect ? "text-red-600 font-bold" : ""}`}
                  >
                    {opt}
                    {isStudent && !isCorrect && " (Your Answer)"}
                    {isCorrect && " (Correct Answer)"}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Fill in the Blank */}
          {q.type === "fill_blank" && (
            <div>
              <p>
                Your Answer:{" "}
                <span
                  className={
                    q.isCorrect ? "text-green-600 font-bold" : "text-red-600 font-bold"
                  }
                >
                  {q.studentAnswer || "No Answer"}
                </span>
              </p>
              {!q.isCorrect && (
                <p>
                  Correct Answer:{" "}
                  <span className="text-green-600 font-bold">{q.correctAnswer}</span>
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
